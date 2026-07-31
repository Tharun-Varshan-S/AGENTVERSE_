const mongoose = require('mongoose');

/**
 * Append-only, durably-ordered event log. This is new/additive alongside the
 * existing Incident.agent_logs[]/audit_trail[] fields, which are unchanged and
 * keep being written exactly as before. Nothing updates or deletes a
 * WorkflowEvent once written (see WorkflowEventStore.js).
 */
const WorkflowEventSchema = new mongoose.Schema({
  workflow_id: {
    type: String,
    required: true,
    index: true
  },
  seq: {
    type: Number,
    required: true
  },
  event_type: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actor: {
    type: String,
    default: 'system'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

WorkflowEventSchema.index({ workflow_id: 1, seq: 1 }, { unique: true });

module.exports = mongoose.model('WorkflowEvent', WorkflowEventSchema);
