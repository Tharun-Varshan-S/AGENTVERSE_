const eventBus = require('../eventbus/EventBus');
const Workflow = require('../models/Workflow');
const { TRANSITIONS } = require('../config/workflowTransitions');
const featureFlags = require('../config/featureFlags');

class WorkflowEngine {
  constructor() {
    this.init();
  }

  init() {
    // Subscribe to all events on the EventBus
    eventBus.on('*', async (event) => {
      // Hard rule: Engine runs strictly behind ENABLE_WORKFLOW_ENGINE flag
      if (!featureFlags.isEnabled('ENABLE_WORKFLOW_ENGINE')) return;

      try {
        await this.processEvent(event);
      } catch (err) {
        console.error(`[WorkflowEngine] Error processing event: ${err.message}`);
      }
    });
  }

  async processEvent(event) {
    const { workflow_id, event_type, payload } = event;

    // Load the existing workflow state
    // Note: workflow_id currently matches incident_id
    let workflow = await Workflow.findOne({ incident_id: workflow_id });
    
    // If we receive an event but no workflow exists yet, initialize it
    if (!workflow) {
      workflow = new Workflow({
        workflow_id,
        incident_id: workflow_id,
        state: 'CREATED',
        version: 0
      });
      await workflow.save();
    }

    // Find a valid transition
    const transition = TRANSITIONS.find(t => 
      (t.fromState === '*' || t.fromState === workflow.state) &&
      t.eventType === event_type &&
      t.condition(payload)
    );

    if (transition) {
      const oldState = workflow.state;
      const newState = transition.toState;

      if (oldState !== newState) {
        workflow.state = newState;
        workflow.version = (workflow.version || 0) + 1;
        workflow.updated_at = new Date();
        
        await workflow.save();
        console.log(`[WorkflowEngine] State transition: ${oldState} -> ${newState} (Event: ${event_type})`);
      }
    }
  }
}

// Singleton instantiation
const workflowEngine = new WorkflowEngine();
module.exports = workflowEngine;
