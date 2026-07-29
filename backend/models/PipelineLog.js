const mongoose = require('mongoose');

const PipelineLogSchema = new mongoose.Schema({
  incident_id: {
    type: String,
    required: true
  },
  pipeline_id: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'failed'],
    default: 'started'
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  completed_at: Date,
  total_duration_ms: Number,
  agent_traces: [{
    agent_name: String,
    status: String,
    execution_time_sec: Number,
    confidence: Number,
    input_summary: String,
    output_summary: String,
    logs: [String],
    error: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('PipelineLog', PipelineLogSchema);
