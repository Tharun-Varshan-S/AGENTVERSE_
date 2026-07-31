/**
 * Central registry of feature flags gating every new CivicResolve v2 subsystem.
 * All flags default OFF: merging code that reads these must never silently
 * change production behavior. Flip a flag on via the environment to opt in.
 */
const FLAGS = [
  'ENABLE_EVENT_BUS',
  'ENABLE_AGENT_RUNTIME',
  'ENABLE_UNDERSTANDING_AGENT',
  'ENABLE_CLASSIFICATION_AGENT',
  'ENABLE_PRIORITY_AGENT',
  'ENABLE_POLICY_VALIDATION_AGENT',
  'ENABLE_DUPLICATE_DETECTION_AGENT',
  'ENABLE_QUALITY_REVIEW_AGENT',
  'ENABLE_WORKFLOW_ENGINE',
  'USE_NEW_WORKFLOW_ENGINE',
  'ENABLE_OBSERVABILITY'
];

function isEnabled(flagName) {
  return process.env[flagName] === 'true';
}

module.exports = { FLAGS, isEnabled };
