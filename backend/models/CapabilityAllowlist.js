const mongoose = require('mongoose');

/**
 * Per-agent-type allowlist of what an agent is permitted to use, stored as
 * data (seeded by seed/seedAllowlists.js) rather than hardcoded in the
 * runtime — so AllowlistEnforcer.js can check against it instead of trusting
 * agent code by convention. Phase 2 checks this at the agent-type level
 * (declarative: "is this agent type permitted to run at all") rather than
 * intercepting each individual internal call the wrapped legacy agent
 * functions make — true per-call interception would require instrumenting
 * each agent's internals, which this phase deliberately does not touch.
 */
const CapabilityAllowlistSchema = new mongoose.Schema({
  agent_type: {
    type: String,
    required: true,
    unique: true
  },
  capabilities: {
    type: [String],
    default: []
  },
  services: [{
    service: String,
    operations: [String]
  }],
  external_apis: {
    type: [String],
    default: []
  },
  version: {
    type: Number,
    default: 1
  }
});

module.exports = mongoose.model('CapabilityAllowlist', CapabilityAllowlistSchema);
