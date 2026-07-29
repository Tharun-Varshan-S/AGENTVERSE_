const { z } = require('zod');

/**
 * Zod Schema for Multilingual Translation Sub-Agent.
 * Standardizes language detection and English translation.
 */
const TranslationOutputSchema = z.object({
  detected_language: z.string().default("English")
    .describe("Detected primary language of the citizen text (e.g. English, Tamil, Hindi, Spanish)"),
  is_english: z.boolean().default(true)
    .describe("True if the input is already in English, false otherwise"),
  english_translation: z.string().min(5)
    .describe("Accurate English translation of the complaint text")
});

/**
 * Safe runtime validation helper for Translation Agent outputs.
 */
function validateTranslationOutput(data) {
  const result = TranslationOutputSchema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`[TranslationSchema Validation Error] ${errorMessages}`);
  }
  return result.data;
}

module.exports = {
  TranslationOutputSchema,
  validateTranslationOutput
};
