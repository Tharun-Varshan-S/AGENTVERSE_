const dotenv = require('dotenv');
dotenv.config();

/**
 * New (Phase 3, CivicResolve v2). Goal: validate required fields, detect
 * PII and prompt-injection attempts in citizen-submitted text, and flag
 * content-safety concerns BEFORE the complaint proceeds further. Per spec:
 * illegal/harmful content is a hard override (`halt: true`) that is never
 * softened into a low-confidence flag — deterministic, not an LLM opinion,
 * so this check can't be argued away by clever phrasing in the complaint
 * text itself. Runs alongside the existing pipeline; does not block or
 * mutate any existing agent's output — the pipeline still routes around
 * this agent's result today (real workflow-halting on `halt: true` is a
 * Workflow Engine responsibility, introduced in a later phase).
 */

const PII_PATTERNS = {
  email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  phone: /\b(?:\+?\d{1,3}[-.\s]?)?\d{10}\b/,
  aadhaar_like: /\b\d{4}\s?\d{4}\s?\d{4}\b/,
  card_like: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/
};

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all|any|previous|prior) instructions/i,
  /disregard (the|all|any) (system|previous) prompt/i,
  /you are now/i,
  /act as (a |an )?(system|admin|developer)/i,
  /reveal (your|the) (system prompt|instructions)/i
];

// Deliberately narrow, unambiguous safety triggers only — this is a coarse
// keyword net meant to route to human moderation, not a content classifier;
// false positives are cheap (a human reviews), false negatives are not.
const UNSAFE_CONTENT_KEYWORDS = [
  'kill you', 'bomb threat', 'i will hurt', 'planning to attack', 'mass casualty'
];

function validateRequiredFields(intakeResult) {
  const issues = [];
  if (!intakeResult.description || intakeResult.description.trim().length === 0) issues.push('description is empty');
  if (!intakeResult.issue_category) issues.push('issue_category is missing');
  if (!intakeResult.location || !intakeResult.location.address) issues.push('location/address is missing');
  return issues;
}

function detectPII(text) {
  const types = Object.entries(PII_PATTERNS).filter(([, re]) => re.test(text)).map(([type]) => type);
  return { detected: types.length > 0, types };
}

function detectPromptInjection(text) {
  return PROMPT_INJECTION_PATTERNS.some(re => re.test(text));
}

function detectUnsafeContent(text) {
  const lower = text.toLowerCase();
  return UNSAFE_CONTENT_KEYWORDS.some(k => lower.includes(k));
}

/**
 * Main Policy Validation Agent Entry Point. Deterministic (no LLM) by
 * design: a safety/compliance gate should not itself be susceptible to the
 * prompt-injection or persuasion techniques it's meant to catch.
 */
async function policyValidationAgent(intakeResult = {}) {
  console.log('[PolicyValidationAgent] Executing policy/content-safety validation...');

  const description = intakeResult.description || '';
  const fieldIssues = validateRequiredFields(intakeResult);
  const pii = detectPII(description);
  const promptInjection = detectPromptInjection(description);
  const unsafeContent = detectUnsafeContent(description);

  const issues = [...fieldIssues];
  if (pii.detected) issues.push(`PII detected: ${pii.types.join(', ')}`);
  if (promptInjection) issues.push('possible prompt-injection pattern detected in complaint text');
  if (unsafeContent) issues.push('content-safety keyword match — requires human moderation review');

  const halt = unsafeContent; // per spec: hard override, never a soft/low-confidence flag
  const passed = issues.length === 0;

  const result = {
    passed,
    halt,
    issues,
    field_issues: fieldIssues,
    pii_detected: pii.detected,
    pii_types: pii.types,
    prompt_injection_detected: promptInjection,
    unsafe_content_detected: unsafeContent,
    reasoning: halt
      ? 'Content-safety keyword match — halting for restricted human moderation review, bypassing downstream agents.'
      : (passed ? 'All policy checks passed.' : `Validation issues found: ${issues.join('; ')}`),
    confidence: 0.95 // deterministic checks — confidence reflects check completeness, not an LLM's uncertainty
  };

  console.log(`[PolicyValidationAgent] Passed: ${result.passed} | Halt: ${result.halt}`);
  return result;
}

module.exports = policyValidationAgent;
