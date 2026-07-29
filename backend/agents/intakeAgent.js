const dotenv = require('dotenv');
dotenv.config();

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
const { IntakeOutputSchema, validateIntakeOutput } = require('../schemas/intakeSchema');

const ALLOWED_CATEGORIES = ["pothole", "garbage", "streetlight", "water_leak", "other"];

/**
 * LangChain ChatPromptTemplate with SystemMessage & HumanMessage separation.
 */
const intakePromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are an AI civic intake classifier for a municipal complaint management system.
Analyze the citizen complaint description and accurately classify it into one of the designated categories.

Allowed categories: ["pothole", "garbage", "streetlight", "water_leak", "other"]

Instructions:
- Classify into exactly one category.
- Estimate confidence score between 0.0 and 1.0.
- Provide a clean, standardized summary description.
- Extract key location mentions, urgency indicators, and keyword signals into entities.
- Assign an initial priority (low, medium, high, critical) and explain your reasoning.`
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `Citizen Complaint Description:
"{description}"`
  )
]);

/**
 * Validate & sanitize raw input fields.
 */
function validateInput(rawInput = {}) {
  const rawType = (rawInput.raw_input_type || "").toLowerCase();
  const validTypes = ["photo", "text", "voice"];
  const raw_input_type = validTypes.includes(rawType) 
    ? rawType 
    : (rawInput.image_url || rawInput.image_path ? "photo" : "text");

  const description = (rawInput.description || rawInput.raw_description || "").trim() || "Civic complaint submitted";

  let lat = rawInput.lat !== undefined && rawInput.lat !== "" && !isNaN(Number(rawInput.lat)) ? Number(rawInput.lat) : null;
  let lng = rawInput.lng !== undefined && rawInput.lng !== "" && !isNaN(Number(rawInput.lng)) ? Number(rawInput.lng) : null;

  const address = typeof rawInput.address === 'string' && rawInput.address.trim() ? rawInput.address.trim() : null;
  const image_url = rawInput.image_url || rawInput.image_path || null;

  return {
    raw_input_type,
    description,
    lat,
    lng,
    address,
    image_url
  };
}

/**
 * Resolve location via OpenStreetMap Nominatim reverse geocoding.
 */
async function resolveLocation(lat, lng, manualAddress) {
  let resolvedAddress = "Unknown";
  const numLat = lat !== null ? Number(lat) : 0;
  const numLng = lng !== null ? Number(lng) : 0;

  if (lat !== null && lng !== null) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AGENTVERSE-CivicApp/1.0 (civic-complaint-system)'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          resolvedAddress = data.display_name;
        }
      }
    } catch (err) {
      console.warn(`[IntakeAgent] Reverse geocoding network notice: ${err.message}`);
    }
  }

  if (resolvedAddress === "Unknown" && manualAddress) {
    resolvedAddress = manualAddress;
  }

  return {
    lat: numLat,
    lng: numLng,
    address: resolvedAddress
  };
}

/**
 * Rule-based classification fallback for network offline or 429 rate limit handling.
 */
function ruleBasedClassification(description) {
  const text = description.toLowerCase();
  let category = "other";
  let confidence = 0.7;

  if (text.includes("pothole") || text.includes("road") || text.includes("cracked asphalt") || text.includes("crater")) {
    category = "pothole";
    confidence = 0.85;
  } else if (text.includes("garbage") || text.includes("trash") || text.includes("waste") || text.includes("dump") || text.includes("rubbish")) {
    category = "garbage";
    confidence = 0.85;
  } else if (text.includes("street light") || text.includes("streetlight") || text.includes("lamp") || text.includes("light pole") || text.includes("dark")) {
    category = "streetlight";
    confidence = 0.85;
  } else if (text.includes("water") || text.includes("leak") || text.includes("pipe") || text.includes("drainage") || text.includes("sewage")) {
    category = "water_leak";
    confidence = 0.85;
  }

  return {
    intent: "report_civic_issue",
    category,
    confidence,
    clean_description: description,
    entities: { location_mentions: [], urgency_indicators: [], keyword_signals: [category] },
    priority: category === "pothole" || category === "water_leak" ? "high" : "medium",
    reasoning: "Rule-based keyword fallback classification"
  };
}

/**
 * Dynamic LLM Complaint Classification via LangChain & Modular Zod Schema.
 */
async function classifyComplaint(description) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey) {
    console.warn("[IntakeAgent] GEMINI_API_KEY not set. Using classification rules.");
    return validateIntakeOutput(ruleBasedClassification(description));
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: modelName,
      temperature: 0.1
    });

    // Pass modular Zod schema to withStructuredOutput
    const structuredModel = model.withStructuredOutput(IntakeOutputSchema);
    const runnablePipeline = intakePromptTemplate.pipe(structuredModel);

    console.log(`[IntakeAgent] Invoking LangChain Structured Output Pipeline (${modelName})...`);
    const rawResult = await runnablePipeline.invoke({ description });
    
    // Immediate runtime schema validation
    return validateIntakeOutput(rawResult);
  } catch (err) {
    const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429;
    if (isRateLimit) {
      console.warn(`⚠️ [RATE LIMIT ALERT] HTTP 429 Too Many Requests on Gemini API (${modelName})! Using rule fallback.`);
    } else {
      console.warn(`[IntakeAgent Notice] LLM Exception: ${err.message}. Using rule fallback.`);
    }
    return validateIntakeOutput(ruleBasedClassification(description));
  }
}

/**
 * Main Intake Agent Entry Point.
 */
async function intakeAgent(incident, rawInput = {}) {
  console.log("[IntakeAgent] Executing dynamic AI intake agent...");
  
  const inputData = validateInput(rawInput);
  const locationData = await resolveLocation(inputData.lat, inputData.lng, inputData.address);
  const classificationResult = await classifyComplaint(inputData.description);

  const output = {
    raw_input_type: inputData.raw_input_type,
    description: classificationResult.clean_description,
    issue_category: classificationResult.category,
    location: locationData,
    image_url: inputData.image_url,
    confidence: classificationResult.confidence,
    intent: classificationResult.intent,
    priority: classificationResult.priority,
    entities: classificationResult.entities,
    reasoning: classificationResult.reasoning
  };

  console.log(`[IntakeAgent] Classified Category: '${output.issue_category}' (Priority: ${output.priority}, Confidence: ${output.confidence})`);
  return output;
}

module.exports = intakeAgent;
