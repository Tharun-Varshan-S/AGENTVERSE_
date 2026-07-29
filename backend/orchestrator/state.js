const { Annotation } = require('@langchain/langgraph');

/**
 * LangGraph State Annotation Schema for Civic Complaint Multi-Agent System.
 */
const CivicWorkflowState = Annotation.Root({
  incident_id: Annotation({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
  raw_input: Annotation({
    value: (x, y) => y ?? x,
    default: () => ({}),
  }),
  translation: Annotation({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
  intake: Annotation({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
  routing: Annotation({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
  requires_officer_approval: Annotation({
    value: (x, y) => y ?? x,
    default: () => false,
  }),
  approval_status: Annotation({
    value: (x, y) => y ?? x,
    default: () => "approved",
  }),
  draft: Annotation({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
  tracking: Annotation({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
  status: Annotation({
    value: (x, y) => y ?? x,
    default: () => "intake",
  }),
  errors: Annotation({
    value: (x, y) => x.concat(y),
    default: () => [],
  })
});

module.exports = {
  CivicWorkflowState
};
