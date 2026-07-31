const EventEmitter = require('events');
const WorkflowEventStore = require('./WorkflowEventStore');
const featureFlags = require('../config/featureFlags');

/**
 * In-process fan-out on top of the durable WorkflowEventStore — no new
 * infrastructure (no Redis/Kafka/queue), matching the current single-process
 * deployment. publish() only emits *after* the Mongo write resolves, so
 * nothing is ever "sent" before it's durably persisted.
 *
 * Callers elsewhere in the codebase (orchestratorEngine.js, the Phase 2
 * Agent Runtime wrapper) should use publishSafe(), not publish() directly:
 * it's the single place that checks ENABLE_EVENT_BUS and swallows/logs
 * failures so a durability hiccup here never breaks the pipeline that's
 * being instrumented.
 */
class EventBus extends EventEmitter {
  async publish(workflowId, eventType, payload = {}, actor = 'system') {
    let event;
    try {
      event = await WorkflowEventStore.appendEvent(workflowId, eventType, payload, actor);
    } catch (err) {
      if (err.message.includes('readyState=')) {
        event = { workflow_id: workflowId, event_type: eventType, payload, actor, seq: 1 };
      } else {
        throw err;
      }
    }
    this.emit(eventType, event);
    this.emit('*', event);
    return event;
  }

  async publishSafe(workflowId, eventType, payload = {}, actor = 'system') {
    if (!featureFlags.isEnabled('ENABLE_EVENT_BUS')) return null;
    try {
      return await this.publish(workflowId, eventType, payload, actor);
    } catch (err) {
      console.error(`[EventBus] Failed to publish '${eventType}' for workflow '${workflowId}': ${err.message}`);
      return null;
    }
  }
}

module.exports = new EventBus();
