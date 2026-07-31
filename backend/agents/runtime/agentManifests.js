/**
 * Local, static per-agent-type config for the Agent Runtime wrapper:
 * `declaredSteps` (a human-readable plan template — see AgentPlan.js's
 * doc comment on why this is template-based rather than a live trace for
 * these wrapped legacy agents) and `budget` (§4.7-style execution limits).
 *
 * Unlike CapabilityAllowlist (Mongo, seeded, the actual permission data),
 * these are operational/behavioral knobs, not permissions, so they stay as
 * lightweight local config rather than a new collection.
 *
 * Keys must match the agentType derived in orchestratorEngine.js
 * (`agentName.toLowerCase().replace(/\s+/g, '_')`), which is the same
 * normalization already used for the existing `stageName`/WS event keys —
 * reused here rather than inventing a second convention.
 *
 * Wall-clock budgets are deliberately generous: observed Gemini latency for
 * escalationAgent has run as high as ~68s in testing, so a spec-example
 * default of 30s would turn legitimately-slow-but-successful calls into new
 * BUDGET_EXCEEDED failures that don't exist today — that would be a
 * regression, not an enhancement.
 */
const AGENT_MANIFESTS = {
  intake_agent: {
    declaredSteps: [
      'Validate raw input',
      'Classify issue via LLM (or rule-based fallback)',
      'Reverse-geocode location via Nominatim'
    ],
    budget: { maxWallClockMs: 45000, maxRetries: 1 }
  },
  routing_agent: {
    declaredSteps: [
      'Look up department by category/ward',
      'Consult municipal resource registry',
      'Calculate SLA hours & severity via LLM (or rule-based fallback)'
    ],
    budget: { maxWallClockMs: 45000, maxRetries: 1 }
  },
  drafting_agent: {
    declaredSteps: [
      'Formulate government-tone complaint notice via LLM (or template fallback)'
    ],
    budget: { maxWallClockMs: 45000, maxRetries: 1 }
  },
  escalation_agent: {
    declaredSteps: [
      'Evaluate emergency/SLA-breach signals',
      'Generate escalation directive via LLM (or template fallback)',
      'Derive zonal escalation authority'
    ],
    budget: { maxWallClockMs: 90000, maxRetries: 1 }
  },
  'submission_&_tracking_agent': {
    declaredSteps: [
      'Generate tracking ID & QR payload',
      'Register submission acknowledgment'
    ],
    budget: { maxWallClockMs: 10000, maxRetries: 1 }
  },
  translation_agent: {
    declaredSteps: [
      'Detect input language',
      'Translate/standardize to English via LLM'
    ],
    budget: { maxWallClockMs: 45000, maxRetries: 1 }
  },

  // Phase 3 (new agents, all optional/flag-gated — see featureFlags.js)
  understanding_agent: {
    declaredSteps: [
      'Analyze incident type, stakeholders & affected assets via LLM (or heuristic fallback)',
      'Assess urgency & sentiment',
      'Flag missing context / need for clarification'
    ],
    budget: { maxWallClockMs: 45000, maxRetries: 1 }
  },
  classification_agent: {
    declaredSteps: [
      'Generate candidate categories via LLM (or keyword-scoring fallback)',
      'Rank alternatives with confidence',
      'Fall back to General/Unclassified + log taxonomy gap if nothing fits'
    ],
    budget: { maxWallClockMs: 45000, maxRetries: 1 }
  },
  priority_agent: {
    declaredSteps: [
      'Score available signals (safety keywords, routing severity, recurrence, location, self-reported priority)',
      'Renormalize weights for any unavailable signal',
      'Map weighted score to Critical/High/Medium/Low'
    ],
    budget: { maxWallClockMs: 10000, maxRetries: 1 }
  },
  policy_validation_agent: {
    declaredSteps: [
      'Validate required fields',
      'Detect PII and prompt-injection patterns',
      'Check content-safety keywords (hard halt override)'
    ],
    budget: { maxWallClockMs: 10000, maxRetries: 1 }
  },
  duplicate_detection_agent: {
    declaredSteps: [
      'Query same-category complaints within the recency window',
      'Score category/location/recency/text-similarity signal agreement',
      'Flag probable duplicate only on multi-signal agreement (human confirmation always required)'
    ],
    budget: { maxWallClockMs: 15000, maxRetries: 1 }
  },
  quality_review_agent: {
    declaredSteps: [
      'Check completeness, consistency, policy, formatting, confidence',
      'Report pass/fail per checklist category'
    ],
    budget: { maxWallClockMs: 10000, maxRetries: 1 }
  }
};

function getManifest(agentType) {
  return AGENT_MANIFESTS[agentType] || { declaredSteps: [], budget: {} };
}

module.exports = { AGENT_MANIFESTS, getManifest };
