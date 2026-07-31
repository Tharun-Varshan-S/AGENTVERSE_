const EventEmitter = require('events');
const Incident = require('../models/Incident');
const { broadcastEvent } = require('../websocket/socketServer');
const featureFlags = require('../config/featureFlags');
const eventBus = require('../eventbus/EventBus');
const withAgentRuntime = require('../agents/runtime/withAgentRuntime');

/** Same normalization already used for stageName/WS event keys below — reused as the agent-type key for manifests/allowlists (Phase 2). */
function toAgentType(agentName) {
  return agentName.toLowerCase().replace(/\s+/g, '_');
}

class AgentOrchestratorEngine extends EventEmitter {
  constructor() {
    super();
    this.activeExecutions = new Map();
  }

  /**
   * Helper to append an agent execution log entry to an Incident DB document.
   */
  async recordAgentLog(incidentId, agentName, status, data = {}) {
    try {
      const incident = await Incident.findOne({ incident_id: incidentId }) || await Incident.findById(incidentId).catch(() => null);
      if (!incident) return;

      const logIndex = (incident.agent_logs || []).findIndex(l => l.agent_name === agentName);
      const logEntry = {
        agent_name: agentName,
        status: status,
        started_at: data.started_at || (logIndex >= 0 ? incident.agent_logs[logIndex].started_at : new Date()),
        completed_at: status === 'completed' || status === 'failed' ? new Date() : null,
        duration_ms: data.duration_ms || 0,
        confidence: data.confidence !== undefined ? data.confidence : 0.9,
        input: data.input || null,
        output: data.output || null,
        logs: data.logs || [],
        error: data.error || null,
        metadata: data.metadata || {}
      };

      if (!incident.agent_logs) incident.agent_logs = [];
      if (logIndex >= 0) {
        incident.agent_logs[logIndex] = logEntry;
      } else {
        incident.agent_logs.push(logEntry);
      }

      if (!incident.audit_trail) incident.audit_trail = [];
      incident.audit_trail.push({
        timestamp: new Date(),
        action: `AGENT_${status.toUpperCase()}`,
        actor: agentName,
        details: { confidence: logEntry.confidence, duration_ms: logEntry.duration_ms }
      });

      await incident.save();
    } catch (err) {
      console.error(`[OrchestratorEngine DB Log Error] ${err.message}`);
    }
  }

  /**
   * Safe execution wrapper for individual agent stages.
   */
  async executeAgentStep(incidentId, agentName, agentFn, inputData, sendEventFn = null, customLogs = []) {
    const startTime = Date.now();
    const startedAt = new Date();

    console.log(`[OrchestratorEngine] 🚀 Triggering Agent '${agentName}' for Incident '${incidentId}'...`);
    
    const initialPayload = {
      incident_id: incidentId,
      agent_name: agentName,
      status: 'running',
      started_at: startedAt,
      logs: customLogs.concat([`[${agentName}] Initializing execution context...`, `[${agentName}] Reading payload inputs...`])
    };

    await this.recordAgentLog(incidentId, agentName, 'running', {
      started_at: startedAt,
      input: inputData,
      logs: initialPayload.logs
    });

    if (typeof sendEventFn === 'function') {
      sendEventFn('agent_start', initialPayload);
    }
    // Broadcast via WebSockets
    broadcastEvent('agent_start', initialPayload, incidentId);
    // Additive (Phase 1): durable, ordered event log (no-op unless ENABLE_EVENT_BUS=true)
    await eventBus.publishSafe(incidentId, 'AgentStarted', { agent_name: agentName, input: inputData }, agentName);

    // Additive (Phase 2): Agent Runtime enrichment layer (no-op — calls agentFn
    // directly, unchanged — unless ENABLE_AGENT_RUNTIME=true). The wrapped call
    // still calls the exact same existing agent function; nothing about the
    // agent's own internals is touched.
    const runFn = featureFlags.isEnabled('ENABLE_AGENT_RUNTIME')
      ? withAgentRuntime(agentFn, { agentType: toAgentType(agentName), agentName, workflowId: incidentId })
      : agentFn;

    try {
      const result = await runFn(inputData);
      const durationMs = Date.now() - startTime;
      const completedAt = new Date();

      const confidence = result.confidence !== undefined ? result.confidence : 0.92;
      const executionLogs = initialPayload.logs.concat([
        `[${agentName}] Processing logic completed successfully in ${durationMs}ms.`,
        `[${agentName}] Confidence Score: ${(confidence * 100).toFixed(1)}%.`,
        `[${agentName}] Structuring validated output...`
      ]);

      const successPayload = {
        incident_id: incidentId,
        agent_name: agentName,
        status: 'completed',
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: durationMs,
        confidence: confidence,
        input: inputData,
        output: result,
        logs: executionLogs
      };

      await this.recordAgentLog(incidentId, agentName, 'completed', successPayload);

      const stageName = agentName.toLowerCase().replace(/\s+/g, '_');
      if (typeof sendEventFn === 'function') {
        sendEventFn('agent_step', { stage: stageName, snapshot: successPayload });
      }
      // Broadcast via WebSockets
      broadcastEvent('agent_step', { stage: stageName, snapshot: successPayload }, incidentId);
      // Additive (Phase 1): durable, ordered event log (no-op unless ENABLE_EVENT_BUS=true)
      await eventBus.publishSafe(incidentId, 'AgentCompleted', {
        agent_name: agentName,
        output: result,
        confidence,
        duration_ms: durationMs
      }, agentName);

      console.log(`[OrchestratorEngine] ✅ Agent '${agentName}' Completed (${durationMs}ms)`);
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorLogs = initialPayload.logs.concat([
        `[${agentName}] ❌ Exception encountered: ${error.message}`
      ]);

      const failurePayload = {
        incident_id: incidentId,
        agent_name: agentName,
        status: 'failed',
        started_at: startedAt,
        completed_at: new Date(),
        duration_ms: durationMs,
        error: error.message,
        logs: errorLogs
      };

      await this.recordAgentLog(incidentId, agentName, 'failed', failurePayload);

      const stageName = agentName.toLowerCase().replace(/\s+/g, '_');
      if (typeof sendEventFn === 'function') {
        sendEventFn('agent_error', { stage: stageName, error: error.message });
      }
      // Broadcast via WebSockets
      broadcastEvent('agent_error', { stage: stageName, error: error.message }, incidentId);
      // Additive (Phase 1): durable, ordered event log (no-op unless ENABLE_EVENT_BUS=true)
      await eventBus.publishSafe(incidentId, 'Failed', {
        agent_name: agentName,
        error: error.message,
        duration_ms: durationMs
      }, agentName);

      console.error(`[OrchestratorEngine] ❌ Agent '${agentName}' Failed: ${error.message}`);
      throw error;
    }
  }
}

const orchestratorEngine = new AgentOrchestratorEngine();
module.exports = orchestratorEngine;
