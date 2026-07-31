const dotenv = require('dotenv');
dotenv.config();

/**
 * New (Phase 3, CivicResolve v2). Goal: final auditor — independently
 * re-verify the other agents' outputs for internal consistency before
 * submission. Per spec: reports PASS/FAIL PER CHECKLIST CATEGORY, not one
 * blended score, so a single hard failure can't hide inside an otherwise
 * good average. Deliberately deterministic/rule-based rather than another
 * LLM call: an auditor that uses the same kind of judgment as the agents it
 * is auditing can't independently catch their mistakes. Runs alongside the
 * existing pipeline; informational only in this phase — it does not block
 * submission (that requires the Workflow Engine's HUMAN_REVIEW routing,
 * introduced in a later phase).
 */

const LOW_CONFIDENCE_THRESHOLD = 0.6;

function checkCompleteness({ intakeResult, routingResult, draftResult }) {
  const notes = [];
  if (!draftResult.complaint_text || draftResult.complaint_text.trim().length < 20) notes.push('drafted complaint_text is missing or too short');
  if (!routingResult.department) notes.push('routing.department is missing');
  if (!intakeResult.location?.address || intakeResult.location.address === 'Unknown') notes.push('intake location/address is missing or unresolved');
  return { category: 'completeness', passed: notes.length === 0, notes };
}

function checkConsistency({ intakeResult, routingResult, draftResult }) {
  const notes = [];
  const draftText = (draftResult.complaint_text || '').toLowerCase();
  if (routingResult.department && !draftText.includes(routingResult.department.toLowerCase())) {
    notes.push('drafted complaint_text does not mention the routed department');
  }
  if (intakeResult.issue_category && !draftText.includes(intakeResult.issue_category.replace('_', ' '))) {
    notes.push('drafted complaint_text does not clearly reference the classified issue category');
  }
  return { category: 'consistency', passed: notes.length === 0, notes };
}

function checkPolicy({ policyValidationResult }) {
  if (!policyValidationResult) {
    return { category: 'policy', passed: true, notes: ['Policy Validation Agent did not run for this workflow — nothing to cross-check'] };
  }
  const notes = policyValidationResult.passed ? [] : [`Policy Validation reported: ${(policyValidationResult.issues || []).join('; ')}`];
  return { category: 'policy', passed: policyValidationResult.passed !== false, notes };
}

function checkFormatting({ draftResult }) {
  const notes = [];
  const text = draftResult.complaint_text || '';
  if (text.includes('undefined') || text.includes('null')) notes.push('drafted text contains a literal "undefined"/"null" — likely a template substitution bug');
  if (!draftResult.reference_number) notes.push('draft.reference_number is missing');
  return { category: 'formatting', passed: notes.length === 0, notes };
}

function checkConfidence({ intakeResult, routingResult, draftResult }) {
  const notes = [];
  const stages = { intake: intakeResult.confidence, routing: routingResult.confidence, draft: draftResult.confidence };
  for (const [stage, confidence] of Object.entries(stages)) {
    if (typeof confidence === 'number' && confidence < LOW_CONFIDENCE_THRESHOLD) {
      notes.push(`${stage} confidence (${confidence}) is below the ${LOW_CONFIDENCE_THRESHOLD} spot-audit threshold`);
    }
  }
  return { category: 'confidence', passed: notes.length === 0, notes };
}

/**
 * Main Quality Review Agent Entry Point.
 */
async function qualityReviewAgent({ intakeResult = {}, routingResult = {}, draftResult = {}, policyValidationResult = null } = {}) {
  console.log('[QualityReviewAgent] Executing independent cross-agent quality audit...');

  const context = { intakeResult, routingResult, draftResult, policyValidationResult };
  const checklist = [
    checkCompleteness(context),
    checkConsistency(context),
    checkPolicy(context),
    checkFormatting(context),
    checkConfidence(context)
  ];

  const overall_passed = checklist.every(c => c.passed);
  const failedCategories = checklist.filter(c => !c.passed).map(c => c.category);

  const result = {
    checklist,
    overall_passed,
    failed_categories: failedCategories,
    reasoning: overall_passed
      ? 'All checklist categories passed independent review.'
      : `Failed categories: ${failedCategories.join(', ')}.`,
    confidence: overall_passed ? 0.95 : 0.7
  };

  console.log(`[QualityReviewAgent] Overall passed: ${result.overall_passed} (failed: [${failedCategories.join(', ')}])`);
  return result;
}

module.exports = qualityReviewAgent;
