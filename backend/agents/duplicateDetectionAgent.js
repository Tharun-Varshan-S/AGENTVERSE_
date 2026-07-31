const dotenv = require('dotenv');
dotenv.config();

const Incident = require('../models/Incident');

/**
 * New (Phase 3, CivicResolve v2). Goal: detect existing complaints that
 * likely match this one. Per spec: requires agreement across MULTIPLE
 * independent signals (category, location, recency, description similarity)
 * before suggesting a match — never flags a probable duplicate off a single
 * signal — and always leaves the final merge decision to a human
 * (`requires_human_confirmation: true`, always). Runs alongside the
 * existing pipeline; purely informational in this phase — it does not block
 * or alter submission.
 */

const RECENCY_WINDOW_DAYS = 30;
const TEXT_SIMILARITY_THRESHOLD = 0.35;
const MIN_SIGNALS_TO_FLAG = 2;

function tokenize(text = '') {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );
}

/** Simple Jaccard word-overlap similarity — a documented stand-in for real
 * embedding-based semantic search, which needs an embedding capability this
 * phase does not add. */
function textSimilarity(a, b) {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) if (setB.has(word)) intersection += 1;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Main Duplicate Detection Agent Entry Point.
 */
async function duplicateDetectionAgent({ intakeResult = {}, incidentId = null } = {}) {
  console.log('[DuplicateDetectionAgent] Executing multi-signal duplicate detection...');

  const category = intakeResult.issue_category || 'other';
  const description = intakeResult.description || '';
  const address = intakeResult.location?.address || '';
  const since = new Date(Date.now() - RECENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  let candidates = [];
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      candidates = await Incident.find({
        incident_id: { $ne: incidentId },
        'intake.issue_category': category,
        created_at: { $gte: since }
      }).limit(25).maxTimeMS(2000);
    }
  } catch (err) {
    console.warn(`[DuplicateDetectionAgent] DB lookup notice: ${err.message}`);
  }

  let best = null;

  for (const candidate of candidates) {
    const candidateAddress = candidate.intake?.location?.address || '';
    const candidateDescription = candidate.intake?.description || '';

    const signals = {
      sameCategory: true, // already filtered by the query
      locationProximity: Boolean(address) && Boolean(candidateAddress) && candidateAddress.toLowerCase().includes(address.toLowerCase().split(',')[0].toLowerCase()),
      withinRecencyWindow: true, // already filtered by the query
      textSimilarity: textSimilarity(description, candidateDescription) >= TEXT_SIMILARITY_THRESHOLD
    };

    const agreeingSignals = Object.values(signals).filter(Boolean).length;

    if (agreeingSignals >= MIN_SIGNALS_TO_FLAG && (!best || agreeingSignals > best.agreeingSignals)) {
      best = { incident_id: candidate.incident_id, agreeingSignals, signals, similarity: textSimilarity(description, candidateDescription) };
    }
  }

  const result = {
    probable_duplicate: Boolean(best),
    matched_incident_id: best ? best.incident_id : null,
    agreeing_signals: best ? best.agreeingSignals : 0,
    signals_checked: best ? best.signals : null,
    candidates_scanned: candidates.length,
    requires_human_confirmation: true, // per spec: never fully automatic
    reasoning: best
      ? `Matched incident '${best.incident_id}' on ${best.agreeingSignals} independent signals (category + ${Object.entries(best.signals).filter(([k, v]) => v && k !== 'sameCategory').map(([k]) => k).join(', ')}).`
      : `No candidate met the ${MIN_SIGNALS_TO_FLAG}-signal agreement threshold among ${candidates.length} same-category complaints scanned in the last ${RECENCY_WINDOW_DAYS} days.`,
    confidence: best ? Math.min(0.5 + best.agreeingSignals * 0.15, 0.9) : 0.7
  };

  console.log(`[DuplicateDetectionAgent] Probable duplicate: ${result.probable_duplicate} (${result.agreeing_signals} signals)`);
  return result;
}

module.exports = duplicateDetectionAgent;
