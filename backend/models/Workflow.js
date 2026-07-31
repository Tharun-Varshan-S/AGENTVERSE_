const mongoose = require('mongoose');

/**
 * Lightweight parallel record alongside Incident. Today (Phase 1) it exists
 * only so WorkflowEventStore has an atomic per-workflow sequence counter to
 * increment (`event_seq`) — nothing else reads or writes `state`/`version`
 * yet. The full state-machine enum and transition-driven updates to `state`
 * are introduced by the Workflow Engine in a later phase; this schema is
 * intentionally loose until then so adding it now can't break anything.
 *
 * `workflow_id` is currently always set to the owning Incident's incident_id
 * (a 1:1 relationship in the current single-pipeline model) rather than a
 * separately-generated id.
 */
const WorkflowSchema = new mongoose.Schema({
  workflow_id: {
    type: String,
    required: true,
    unique: true
  },
  incident_id: {
    type: String
  },
  state: {
    type: String,
    default: 'CREATED'
  },
  event_seq: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Workflow', WorkflowSchema);
