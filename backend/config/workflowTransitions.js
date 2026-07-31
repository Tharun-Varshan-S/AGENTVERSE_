const { STATES } = require('./workflowStates');

const TRANSITIONS = [
  // Intake Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Intake Agent',
    toState: STATES.INTAKE
  },
  
  // Understanding Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Understanding Agent',
    toState: STATES.UNDERSTANDING
  },
  
  // Classification Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Classification Agent',
    toState: STATES.CLASSIFICATION
  },

  // Routing Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Routing Agent',
    toState: STATES.ROUTING
  },

  // Priority Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Priority Agent',
    toState: STATES.PRIORITY
  },

  // Policy Validation Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Policy Validation Agent',
    toState: STATES.POLICY_VALIDATION
  },

  // Duplicate Detection Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Duplicate Detection Agent',
    toState: STATES.DUPLICATE_CHECK
  },

  // Drafting Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Drafting Agent',
    toState: STATES.DRAFTING
  },
  
  // Quality Review Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Quality Review Agent',
    toState: STATES.QUALITY_REVIEW
  },

  // Escalation Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Escalation Agent',
    toState: STATES.ESCALATED
  },

  // Submission & Tracking Agent
  {
    fromState: '*',
    eventType: 'AgentStarted',
    condition: (ctx) => ctx.agent_name === 'Submission & Tracking Agent',
    toState: STATES.TRACKING
  },
  {
    fromState: '*',
    eventType: 'AgentCompleted',
    condition: (ctx) => ctx.agent_name === 'Submission & Tracking Agent',
    toState: STATES.SUBMITTED
  },

  // Global Failure
  {
    fromState: '*',
    eventType: 'Failed',
    condition: () => true,
    toState: STATES.FAILED
  }
];

module.exports = {
  TRANSITIONS
};
