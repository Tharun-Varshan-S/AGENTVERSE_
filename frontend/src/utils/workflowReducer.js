export function buildWorkflowGraph(workflowEvents) {
  const nodes = [];
  const edges = [];
  const stateByAgent = {}; // agent_type -> { status, startTime, endTime, capabilities, output, error }

  if (!workflowEvents || workflowEvents.length === 0) {
    return { nodes, edges, stateByAgent };
  }

  workflowEvents.forEach((evt, idx) => {
    const { event_type, payload } = evt;

    if (event_type === 'AgentStarted') {
      const agentType = payload.agent_type;
      stateByAgent[agentType] = {
        agentType,
        status: 'RUNNING',
        startTime: evt.created_at,
        capabilities: [],
        output: null,
        error: null,
        logs: []
      };
      nodes.push({ id: `node-${idx}`, type: 'AgentStarted', agentType, timestamp: evt.created_at });
    } else if (event_type === 'CapabilityInvoked') {
      const agentType = payload.agent_type;
      if (stateByAgent[agentType]) {
        stateByAgent[agentType].capabilities.push({
          type: 'invoked',
          capability: payload.capability || payload.service,
          timestamp: evt.created_at
        });
      }
      nodes.push({ id: `node-${idx}`, type: 'CapabilityInvoked', agentType, payload, timestamp: evt.created_at });
    } else if (event_type === 'CapabilityDenied') {
      const agentType = payload.agent_type;
      if (stateByAgent[agentType]) {
        stateByAgent[agentType].capabilities.push({
          type: 'denied',
          capability: payload.capability || payload.service,
          reason: payload.reason,
          timestamp: evt.created_at
        });
      }
      nodes.push({ id: `node-${idx}`, type: 'CapabilityDenied', agentType, payload, timestamp: evt.created_at });
    } else if (event_type === 'AgentCompleted') {
      const agentType = payload.agent_type;
      if (stateByAgent[agentType]) {
        stateByAgent[agentType].status = 'COMPLETED';
        stateByAgent[agentType].endTime = evt.created_at;
        stateByAgent[agentType].output = payload.result;
      }
      nodes.push({ id: `node-${idx}`, type: 'AgentCompleted', agentType, payload, timestamp: evt.created_at });
    } else if (event_type === 'Failed' || event_type === 'WorkflowFailed') {
      const agentType = payload.agent_type || 'unknown';
      if (stateByAgent[agentType]) {
        stateByAgent[agentType].status = 'FAILED';
        stateByAgent[agentType].endTime = evt.created_at;
        stateByAgent[agentType].error = payload.error || payload.reason;
      }
      nodes.push({ id: `node-${idx}`, type: 'Failed', agentType, payload, timestamp: evt.created_at });
    } else if (event_type === 'StateTransition') {
       nodes.push({ id: `node-${idx}`, type: 'StateTransition', from: payload.from, to: payload.to, timestamp: evt.created_at });
    }
  });

  return { nodes, edges, stateByAgent };
}
