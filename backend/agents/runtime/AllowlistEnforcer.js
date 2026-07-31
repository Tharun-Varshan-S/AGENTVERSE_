const CapabilityAllowlist = require('../../models/CapabilityAllowlist');

/**
 * Gate in front of the Agent Runtime wrapper: an agent type may only run if
 * it has a seeded CapabilityAllowlist entry (see seed/seedAllowlists.js). A
 * missing entry is treated as a denial (fail safe), not "no restrictions" —
 * the point is that this must be a real check, not convention. In-memory
 * cache avoids a DB round-trip on every single agent invocation.
 */
const CACHE_TTL_MS = 60000;
let cache = null;
let cacheLoadedAt = 0;

async function loadCache() {
  const docs = await CapabilityAllowlist.find({});
  cache = new Map(docs.map(d => [d.agent_type, d]));
  cacheLoadedAt = Date.now();
}

async function getAllowlist(agentType) {
  if (!cache || Date.now() - cacheLoadedAt > CACHE_TTL_MS) {
    await loadCache();
  }
  return cache.get(agentType) || null;
}

async function assertAllowed(agentType) {
  const doc = await getAllowlist(agentType);
  if (!doc) {
    const err = new Error(`no capability_allowlists entry for agent_type '${agentType}' (run seed/seedAllowlists.js, or this agent type is genuinely not permitted)`);
    err.code = 'CAPABILITY_DENIED';
    throw err;
  }
  return doc;
}

/** Test/seed-script helper: force the next getAllowlist()/assertAllowed() call to re-read Mongo. */
function invalidateCache() {
  cache = null;
}

module.exports = { assertAllowed, getAllowlist, invalidateCache };
