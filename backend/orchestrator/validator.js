const { z } = require('zod');

// 1. Intake Agent Output Schema
const IntakeSchema = z.object({
  raw_input_type: z.enum(["photo", "text", "voice"]),
  description: z.string().min(1, "Description cannot be empty"),
  issue_category: z.enum(["pothole", "garbage", "streetlight", "water_leak", "other"]),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }),
  image_url: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1)
});

// 2. Routing Agent Output Schema
const RoutingSchema = z.object({
  department: z.string().min(1),
  department_contact: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  sla_hours: z.number().positive()
});

// 3. Drafting Agent Output Schema
const DraftSchema = z.object({
  complaint_text: z.string().min(10, "Complaint text must be substantial"),
  reference_number: z.string().min(5),
  format: z.enum(["letter", "pdf_url"])
});

// 4. Tracking Agent Output Schema
const TrackingSchema = z.object({
  submitted_at: z.union([z.date(), z.string().datetime(), z.string()]),
  current_status: z.enum(["submitted", "acknowledged", "in_progress", "resolved"]),
  last_updated: z.union([z.date(), z.string().datetime(), z.string()])
});

// 5. Escalation Agent Output Schema
const EscalationSchema = z.object({
  escalated: z.boolean(),
  escalated_at: z.union([z.date(), z.string().datetime(), z.string()]),
  escalation_text: z.string(),
  escalated_to: z.string()
});

const schemaMap = {
  intakeAgent: IntakeSchema,
  routingAgent: RoutingSchema,
  draftingAgent: DraftSchema,
  trackingAgent: TrackingSchema,
  escalationAgent: EscalationSchema
};

/**
 * Validates agent output against its defined Zod schema.
 * Throws descriptive validation error if schema contract is violated.
 */
function validateAgentOutput(agentName, output) {
  const schema = schemaMap[agentName];
  if (!schema) {
    throw new Error(`[Validator Error] Unknown agent schema: '${agentName}'`);
  }

  const result = schema.safeParse(output);
  if (!result.success) {
    const formattedErrors = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    console.error(`[Validation Failed] Agent '${agentName}': ${formattedErrors}`);
    throw new Error(`Validation failed for ${agentName}: ${formattedErrors}`);
  }

  return true;
}

module.exports = {
  validateAgentOutput,
  IntakeSchema,
  RoutingSchema,
  DraftSchema,
  TrackingSchema,
  EscalationSchema
};
