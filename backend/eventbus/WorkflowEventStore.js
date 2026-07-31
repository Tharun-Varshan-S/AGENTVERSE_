const mongoose = require('mongoose');
const Workflow = require('../models/Workflow');
const WorkflowEvent = require('../models/WorkflowEvent');

/**
 * Durable, append-only, per-workflow-ordered event log on top of MongoDB —
 * no new infrastructure (no Redis/Kafka/queue). Ordering is guaranteed by an
 * atomic increment on the owning Workflow doc's `event_seq` counter, so two
 * concurrent appends for the same workflow_id can never collide on `seq`
 * (the upsert also transparently creates a minimal Workflow doc on first use,
 * so nothing else needs to explicitly create one for this to work).
 *
 * This is the write-ahead step: callers must await appendEvent() to resolve
 * before treating the event as "sent" (see EventBus.publish()).
 */
async function appendEvent(workflowId, eventType, payload = {}, actor = 'system') {
  // Fail fast instead of letting Mongoose buffer/queue the operation for its
  // default ~10s timeout when there's no live connection (e.g. the existing
  // ALLOW_INMEMORY_FALLBACK shim doesn't cover findOneAndUpdate/create) — the
  // caller (safePublishEvent in orchestratorEngine.js) already treats any
  // rejection here as non-fatal, this just keeps that rejection cheap.
  if (mongoose.connection.readyState !== 1 && process.env.ALLOW_INMEMORY_FALLBACK !== 'true') {
    throw new Error(`no active MongoDB connection (readyState=${mongoose.connection.readyState})`);
  }

  const workflow = await Workflow.findOneAndUpdate(
    { workflow_id: workflowId },
    { $inc: { event_seq: 1 }, $set: { updated_at: new Date() }, $setOnInsert: { incident_id: workflowId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const seq = workflow.event_seq;

  const event = await WorkflowEvent.create({
    workflow_id: workflowId,
    seq,
    event_type: eventType,
    payload,
    actor
  });

  return event;
}

module.exports = { appendEvent };
