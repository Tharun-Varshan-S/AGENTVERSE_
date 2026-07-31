const AgentPlan = require('../../models/AgentPlan');
const AgentMetric = require('../../models/AgentMetric');
const AllowlistEnforcer = require('./AllowlistEnforcer');
const eventBus = require('../../eventbus/EventBus');
const { getManifest } = require('./agentManifests');

const DEFAULT_BUDGET = { maxWallClockMs: 45000, maxRetries: 1 };

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`budget exceeded: exceeded ${ms}ms wall-clock limit`);
      err.code = 'BUDGET_EXCEEDED';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function safeRecordPlan(workflowId, agentName, declaredSteps, status, error) {
  try {
    await AgentPlan.create({ workflow_id: workflowId, agent_name: agentName, declared_steps: declaredSteps, status, error: error || null });
  } catch (err) {
    console.error(`[AgentRuntime] Failed to record plan for '${agentName}': ${err.message}`);
  }
}

async function safeRecordMetric(workflowId, agentName, metric) {
  try {
    await AgentMetric.create({ workflow_id: workflowId, agent_name: agentName, ...metric });
  } catch (err) {
    console.error(`[AgentRuntime] Failed to record metrics for '${agentName}': ${err.message}`);
  }
}

/**
 * Wraps an existing agent function with the Agent Runtime enhancement layer
 * (allowlist check, wall-clock budget, bounded retry, plan/metric audit
 * records, structured-output enrichment) WITHOUT touching the wrapped
 * agent's internals. Enrichment only ADDS fields onto the agent's existing
 * return object (confidence/evidence/warnings/validation/toolsUsed/metrics/
 * plan/status) — every field an existing caller already reads is untouched,
 * so this is a strict superset of today's output shape.
 *
 * @param {Function} agentFn - the existing agent function, called exactly as before
 * @param {{agentType:string, agentName:string, workflowId:string}} context
 */
function withAgentRuntime(agentFn, { agentType, agentName, workflowId }) {
  const manifest = getManifest(agentType);
  const budget = { ...DEFAULT_BUDGET, ...(manifest.budget || {}) };

  return async function runWithRuntime(inputData) {
    const startedAt = Date.now();

    let allowlistDoc;
    try {
      allowlistDoc = await AllowlistEnforcer.assertAllowed(agentType);
    } catch (err) {
      await eventBus.publishSafe(workflowId, 'CapabilityDenied', { agent_name: agentName, reason: err.message }, agentName);
      await safeRecordPlan(workflowId, agentName, manifest.declaredSteps, 'CAPABILITY_DENIED', err.message);
      throw err;
    }

    await safeRecordPlan(workflowId, agentName, manifest.declaredSteps, 'RUNNING', null);

    let attempt = 0;
    let lastError = null;

    while (attempt <= budget.maxRetries) {
      attempt += 1;
      try {
        const result = await withTimeout(agentFn(inputData), budget.maxWallClockMs);
        const durationMs = Date.now() - startedAt;
        const retryCount = attempt - 1;

        // Deliberately does NOT touch result.confidence when the wrapped agent
        // didn't set one (e.g. trackingAgent has no real confidence to report):
        // orchestratorEngine.js's own `result.confidence !== undefined ? ... : 0.92`
        // fallback must keep behaving exactly as it did before this wrapper existed.
        result.status = result.status || 'COMPLETED';
        result.evidence = result.evidence || [];
        result.warnings = result.warnings || [];
        result.validation = result.validation || { passed: true, issues: [] };
        result.toolsUsed = {
          capabilities: allowlistDoc.capabilities,
          services: allowlistDoc.services,
          externalApis: allowlistDoc.external_apis
        };
        result.metrics = {
          executionTimeMs: durationMs,
          retryCount,
          budgetRemaining: { maxWallClockMs: budget.maxWallClockMs, maxRetries: budget.maxRetries - retryCount }
        };
        result.plan = { agentType, declaredSteps: manifest.declaredSteps, truncated: false };

        await safeRecordPlan(workflowId, agentName, manifest.declaredSteps, 'COMPLETED', null);
        await safeRecordMetric(workflowId, agentName, { duration_ms: durationMs, confidence: result.confidence, retry_count: retryCount, status: result.status });
        if (retryCount > 0) {
          await eventBus.publishSafe(workflowId, 'RetrySucceeded', { agent_name: agentName, attempt }, agentName);
        }

        return result;
      } catch (err) {
        lastError = err;

        if (err.code === 'BUDGET_EXCEEDED') {
          await eventBus.publishSafe(workflowId, 'BudgetExceeded', { agent_name: agentName, limit_ms: budget.maxWallClockMs }, agentName);
          await safeRecordPlan(workflowId, agentName, manifest.declaredSteps, 'BUDGET_EXCEEDED', err.message);
          await safeRecordMetric(workflowId, agentName, { duration_ms: Date.now() - startedAt, confidence: null, retry_count: attempt - 1, status: 'BUDGET_EXCEEDED' });
          throw err; // a hard wall-clock budget is never silently retried past
        }

        if (attempt <= budget.maxRetries) {
          await eventBus.publishSafe(workflowId, 'RetryStarted', { agent_name: agentName, attempt, error: err.message }, agentName);
          continue;
        }
      }
    }

    await safeRecordPlan(workflowId, agentName, manifest.declaredSteps, 'FAILED', lastError && lastError.message);
    await safeRecordMetric(workflowId, agentName, { duration_ms: Date.now() - startedAt, confidence: null, retry_count: attempt - 1, status: 'FAILED' });
    throw lastError;
  };
}

module.exports = withAgentRuntime;
