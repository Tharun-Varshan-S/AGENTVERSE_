const dotenv = require('dotenv');
dotenv.config();

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
const { TranslationOutputSchema, validateTranslationOutput } = require('../schemas/translationSchema');

/**
 * LangChain ChatPromptTemplate for Multilingual Detection & Translation.
 */
const translationPromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a multilingual translation agent for municipal governance.
Analyze the citizen input text.

Instructions:
- Detect the language of the input.
- If it is already English, set is_english to true and english_translation to the original text.
- If it is non-English (e.g. Tamil, Hindi, Spanish, French), translate it accurately into formal English.`
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `Input Text:
"{text}"`
  )
]);

/**
 * Dynamic Multilingual Translation Sub-Agent Entry Point.
 */
async function translationAgent(text) {
  console.log("[TranslationAgent] Executing dynamic multilingual detection agent...");
  const rawText = (text || "").trim();

  if (!rawText) {
    return validateTranslationOutput({
      detected_language: "English",
      is_english: true,
      english_translation: "Civic complaint submitted"
    });
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey) {
    console.warn("[TranslationAgent] GEMINI_API_KEY not configured. Passing raw text.");
    return validateTranslationOutput({
      detected_language: "English",
      is_english: true,
      english_translation: rawText
    });
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: modelName,
      temperature: 0.1
    });

    const structuredModel = model.withStructuredOutput(TranslationOutputSchema);
    const runnablePipeline = translationPromptTemplate.pipe(structuredModel);

    console.log(`[TranslationAgent] Invoking LangChain Structured Translation Pipeline (${modelName})...`);
    const result = await runnablePipeline.invoke({ text: rawText });
    
    const validated = validateTranslationOutput(result);
    console.log(`[TranslationAgent] Detected Language: '${validated.detected_language}' (Is English: ${validated.is_english})`);
    return validated;
  } catch (err) {
    console.warn(`[TranslationAgent Notice] LLM Translation Exception (${err.message}). Using original text.`);
    return validateTranslationOutput({
      detected_language: "English",
      is_english: true,
      english_translation: rawText
    });
  }
}

module.exports = translationAgent;
