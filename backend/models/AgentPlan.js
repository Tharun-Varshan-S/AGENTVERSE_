const mongoose = require('mongoose');

/**
 * Audit record of what an agent run was declared to do and what happened to
 * it. For the existing (Phase 2-wrapped) legacy agents, which are single
 * opaque function calls with no internally-observable step-by-step planning,
 * this is one row per invocation holding the agent type's known/declared
 * step template plus the run's outcome — not a live, per-step trace. Agents
 * built with real planning (later phases) can write multiple rows per
 * workflow (one per actual planning step) against this same schema.
 */
const AgentPlanSchema = new mongoose.Schema({
  workflow_id: {
    type: String,
    required: true,
    index: true
  },
  agent_name: {
    type: String,
    required: true
  },
  declared_steps: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['RUNNING', 'COMPLETED', 'FAILED', 'BUDGET_EXCEEDED', 'CAPABILITY_DENIED'],
    default: 'RUNNING'
  },
  error: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AgentPlan', AgentPlanSchema);
