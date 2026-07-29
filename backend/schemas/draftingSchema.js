const { z } = require('zod');

/**
 * Zod Schema for Drafting Agent Structured LLM Output.
 * Enforces formal municipal notice formatting and legal document structure.
 */
const DraftingOutputSchema = z.object({
  subject: z.string().min(10)
    .describe("Formal municipal subject header for the grievance notice"),
  body: z.string().min(30)
    .describe("Official statement of incident and resolution directives"),
  tone: z.enum(["formal", "urgent", "directive"]).default("formal")
    .describe("Tone of the municipal complaint documentation"),
  complaint_text: z.string().min(50)
    .describe("Complete assembled legal municipal complaint letter"),
  professional_summary: z.string().default("Complaint summary")
    .describe("A professional, concise summary of the complaint"),
  extracted_entities: z.array(z.string()).default([])
    .describe("Key entities extracted from the complaint description (e.g., street names, landmarks, dates)"),
  metadata: z.object({
    sla_target_hours: z.number().positive().default(48),
    target_department: z.string().default("Municipal Grievance Department"),
    severity_level: z.enum(["low", "medium", "high", "critical"]).default("medium")
  }).default({ sla_target_hours: 48, target_department: "Municipal Grievance Department", severity_level: "medium" })
    .describe("Document metadata parameters")
});

/**
 * Safe runtime validation helper for Drafting Agent outputs.
 */
function validateDraftingOutput(data) {
  const result = DraftingOutputSchema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`[DraftingSchema Validation Error] ${errorMessages}`);
  }
  return result.data;
}

module.exports = {
  DraftingOutputSchema,
  validateDraftingOutput
};
