const mongoose = require('mongoose');

/**
 * Denormalized per-run metrics, separate from AgentPlan so later dashboard
 * work (p50/p95/p99 latency, budget-ceiling proximity) can query/aggregate
 * this small flat shape without scanning the richer plan/event records.
 */
const AgentMetricSchema = new mongoose.Schema({
  workflow_id: {
    type: String,
    required: true,
    index: true
  },
  agent_name: {
    type: String,
    required: true,
    index: true
  },
  duration_ms: Number,
  confidence: {
    type: Number,
    default: null
  },
  retry_count: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'COMPLETED'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AgentMetric', AgentMetricSchema);
