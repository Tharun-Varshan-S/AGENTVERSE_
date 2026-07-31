const dotenv = require('dotenv');
dotenv.config();

/**
 * New (Phase 3, CivicResolve v2). Goal: Critical/High/Medium/Low priority
 * from a CONFIGURABLE WEIGHTED SCORING MODEL (below), not hardcoded
 * if/else branching on keywords alone. Deliberately does not let
 * self-reported urgency words dominate on their own (gaming resistance):
 * they are one weighted factor among several, capped, not the whole score.
 * When a signal is unavailable (e.g. no location), that factor is marked
 * explicitly missing and excluded from the score rather than silently
 * treated as "not urgent" (which would silently drag the score down).
 *
 * Runs alongside the existing Routing Agent's own severity assignment;
 * does not replace or mutate it.
 */

const SAFETY_KEYWORDS = ['fire', 'flood', 'live wire', 'electrocut', 'collapse', 'explosion', 'gas leak', 'hazard', 'trapped', 'injury', 'accident'];
const RECURRENCE_KEYWORDS = ['again', 'still not fixed', 'reported before', 'third time', 'repeatedly'];

// The configurable scoring model: weights sum to 1.0 across the factors that
// ARE available for a given complaint; unavailable factors are excluded and
// the remaining weights are renormalized (see computeScore below) rather
// than treated as zero.
const PRIORITY_WEIGHTS = {
  safetyKeywordSignal: 0.35,
  routingSeverityHint: 0.25,
  recurrenceSignal: 0.15,
  locationProximitySignal: 0.15,
  selfReportedPrioritySignal: 0.10 // capped low deliberately — gaming resistance
};

function scoreToLevel(score) {
  if (score >= 0.75) return 'critical';
  if (score >= 0.55) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
}

function computeScore(signals) {
  // signals: { key: number|null } — null means "unavailable", excluded and
  // the remaining weights renormalized so missing data never silently
  // depresses the score.
  const availableKeys = Object.keys(PRIORITY_WEIGHTS).filter(k => signals[k] !== null && signals[k] !== undefined);
  const availableWeightSum = availableKeys.reduce((sum, k) => sum + PRIORITY_WEIGHTS[k], 0) || 1;

  let score = 0;
  const evidence = [];
  const missing_factors = Object.keys(PRIORITY_WEIGHTS).filter(k => !availableKeys.includes(k));

  for (const key of availableKeys) {
    const normalizedWeight = PRIORITY_WEIGHTS[key] / availableWeightSum;
    const contribution = signals[key] * normalizedWeight;
    score += contribution;
    evidence.push(`${key}: value=${signals[key].toFixed(2)}, weight=${normalizedWeight.toFixed(2)}, contribution=${contribution.toFixed(2)}`);
  }

  return { score: Math.min(score, 1), evidence, missing_factors };
}

/**
 * Main Priority Assessment Agent Entry Point. Deterministic, auditable
 * weighted scoring (not an LLM free-text guess) — the LLM is only used
 * (optionally) to phrase the human-readable reasoning, never to decide the
 * priority value itself.
 */
async function priorityAgent({ intakeResult = {}, routingResult = {} } = {}) {
  console.log('[PriorityAgent] Executing configurable weighted priority scoring...');

  const description = (intakeResult.description || '').toLowerCase();
  const hasLocation = Boolean(intakeResult.location?.address && intakeResult.location.address !== 'Unknown');

  const safetyHits = SAFETY_KEYWORDS.filter(k => description.includes(k));
  const recurrenceHits = RECURRENCE_KEYWORDS.filter(k => description.includes(k));

  const routingSeverityMap = { critical: 1, high: 0.75, medium: 0.45, low: 0.15 };
  const selfReportedMap = { critical: 1, high: 0.7, medium: 0.4, low: 0.1 };

  const signals = {
    safetyKeywordSignal: Math.min(safetyHits.length * 0.4, 1),
    routingSeverityHint: routingResult.severity ? routingSeverityMap[routingResult.severity] ?? 0.4 : null,
    recurrenceSignal: recurrenceHits.length > 0 ? Math.min(recurrenceHits.length * 0.5, 1) : 0,
    locationProximitySignal: hasLocation ? 0.5 : null, // no GIS/proximity data source yet — presence-only proxy, documented limitation
    selfReportedPrioritySignal: intakeResult.priority ? selfReportedMap[intakeResult.priority] ?? 0.4 : null
  };

  const { score, evidence, missing_factors } = computeScore(signals);
  const priority = scoreToLevel(score);

  const reasoning = `Weighted score ${score.toFixed(2)} → '${priority}'. Safety keywords matched: [${safetyHits.join(', ') || 'none'}]. `
    + `Recurrence signals: [${recurrenceHits.join(', ') || 'none'}]. `
    + (missing_factors.length ? `Missing/unavailable factors (excluded, weights renormalized): [${missing_factors.join(', ')}].` : 'All factors available.');

  const result = {
    priority,
    score: Number(score.toFixed(3)),
    evidence,
    missing_factors,
    weights: PRIORITY_WEIGHTS,
    reasoning,
    confidence: missing_factors.length > 1 ? 0.6 : 0.85
  };

  console.log(`[PriorityAgent] Priority: '${result.priority}' (score=${result.score}, missing=${missing_factors.length})`);
  return result;
}

module.exports = priorityAgent;
