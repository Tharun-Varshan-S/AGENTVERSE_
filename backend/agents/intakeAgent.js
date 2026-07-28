const dotenv = require('dotenv');
dotenv.config();

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
const { z } = require('zod');

const ALLOWED_CATEGORIES = ["pothole", "garbage", "streetlight", "water_leak", "other"];

// 1. Zod Schema for Structured Output
const ClassificationSchema = z.object({
  category: z.enum(["pothole", "garbage", "streetlight", "water_leak", "other"])
    .describe("Strictly classify into one of the allowed categories: pothole, garbage, streetlight, water_leak, other"),
  confidence: z.number().min(0).max(1)
    .describe("Confidence score between 0.0 and 1.0"),
  clean_description: z.string()
    .describe("Standardized concise summary of the citizen complaint")
});

/**
 * 2. LangChain ChatPromptTemplate definition with explicit SystemMessage and HumanMessage.
 * Separation of system instructions from citizen input increases LLM compliance.
 */
const intakePromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are an AI civic intake classifier for a municipal complaint management system.
Analyze the citizen complaint description and accurately classify it into one of the designated categories.

Allowed categories: ["pothole", "garbage", "streetlight", "water_leak", "other"]

Instructions:
- Provide a category matching the complaint.
- Provide a confidence score between 0.0 and 1.0.
- Provide a clean, standardized summary description of the issue.`
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `Citizen Complaint Description:
"{description}"`
  )
]);

/**
 * 3. Validate & sanitize raw input fields.
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
 * 4. Resolve location using 3-tier priority:
 *    Priority 1: Reverse Geocode via OpenStreetMap Nominatim if lat & lng exist
 *    Priority 2: Manually entered address
 *    Priority 3: "Unknown"
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
      console.warn(`[IntakeAgent] Reverse geocoding failed: ${err.message}. Falling back to manual address.`);
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
 * 5. Rule-based keyword fallback when Gemini API key is missing or calls fail.
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
    category,
    confidence,
    clean_description: description
  };
}

/**
 * 6. Classify complaint using LangChain Chat Model & LCEL Runnable Pipeline with retry.
 */
async function classifyComplaint(description) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.warn("[IntakeAgent] GEMINI_API_KEY not configured. Using keyword fallback.");
    return ruleBasedClassification(description);
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  try {
    // Initialize LangChain Chat Model
    const model = new ChatGoogleGenerativeAI({
      apiKey,
      modelName,
      temperature: 0.1
    });

    // Create Runnable Pipeline: Prompt | Model with Structured Output
    const structuredModel = model.withStructuredOutput(ClassificationSchema);
    const runnablePipeline = intakePromptTemplate.pipe(structuredModel);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[IntakeAgent] Invoking LangChain LCEL pipeline (Attempt ${attempt})...`);
        const result = await runnablePipeline.invoke({ description });
        
        return {
          category: result.category,
          confidence: Math.max(0, Math.min(1, result.confidence || 0.85)),
          clean_description: result.clean_description || description
        };
      } catch (err) {
        console.warn(`[IntakeAgent] LangChain attempt ${attempt} failed: ${err.message}`);
      }
    }
  } catch (initErr) {
    console.warn(`[IntakeAgent] Failed to initialize LangChain Chat Model: ${initErr.message}`);
  }

  console.warn("[IntakeAgent] Falling back to rule-based classification.");
  return ruleBasedClassification(description);
}

/**
 * Main Intake Agent Entry Point (Agent 1).
 */
async function intakeAgent(incident, rawInput = {}) {
  console.log("[IntakeAgent] Starting intake processing...");
  
  // Step 1: Validate and sanitize raw input
  const inputData = validateInput(rawInput);

  // Step 2: Resolve Location (Reverse geocoding -> manual address -> "Unknown")
  const locationData = await resolveLocation(inputData.lat, inputData.lng, inputData.address);

  // Step 3: Classify complaint description via LangChain Runnable pipeline
  const classificationResult = await classifyComplaint(inputData.description);

  // Step 4: Construct final standardized Intake object
  const output = {
    raw_input_type: inputData.raw_input_type,
    description: classificationResult.clean_description,
    issue_category: classificationResult.category,
    location: locationData,
    image_url: inputData.image_url,
    confidence: classificationResult.confidence
  };

  console.log(`[IntakeAgent] Success! Category: '${output.issue_category}', Confidence: ${output.confidence}`);
  return output;
}

module.exports = intakeAgent;
