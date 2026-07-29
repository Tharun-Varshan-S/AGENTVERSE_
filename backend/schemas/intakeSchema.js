const { z } = require('zod');

/**
 * Zod Schema for Intake Agent Structured LLM Output.
 * Enforces strict runtime validation for citizen complaint classification.
 */
const IntakeOutputSchema = z.object({
  intent: z.string().default("report_civic_issue")
    .describe("Primary intent of the citizen submission"),
  category: z.enum(["pothole", "garbage", "streetlight", "water_leak", "other"])
    .describe("Strictly classified category of the civic issue"),
  confidence: z.number().min(0).max(1)
    .describe("Model classification confidence score between 0.0 and 1.0"),
  clean_description: z.string().min(5)
    .describe("Standardized concise summary of the reported issue"),
  entities: z.object({
    location_mentions: z.array(z.string()).default([]),
    urgency_indicators: z.array(z.string()).default([]),
    keyword_signals: z.array(z.string()).default([])
  }).default({ location_mentions: [], urgency_indicators: [], keyword_signals: [] })
    .describe("Extracted key entity signals from the text"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium")
    .describe("Assessed initial priority based on public safety impact"),
  missing_information: z.array(z.string()).default([])
    .describe("List of missing crucial details (e.g., 'exact street number', 'photo evidence')"),
  department_routing_recommendation: z.string().default("General")
    .describe("AI recommended municipal department for this issue"),
  is_duplicate_probable: z.boolean().default(false)
    .describe("Flag if the complaint sounds like a common duplicate issue"),
  reasoning: z.string().default("Classification derived from issue category and safety impact")
    .describe("Explanation for why the classification and priority were assigned")
});

/**
 * Safe runtime validation helper for Intake Agent outputs.
 */
function validateIntakeOutput(data) {
  const result = IntakeOutputSchema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`[IntakeSchema Validation Error] ${errorMessages}`);
  }
  return result.data;
}

module.exports = {
  IntakeOutputSchema,
  validateIntakeOutput
};
