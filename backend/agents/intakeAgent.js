const dotenv = require('dotenv');
dotenv.config();

const ALLOWED_CATEGORIES = ["pothole", "garbage", "streetlight", "water_leak", "other"];

/**
 * 1. Validate & sanitize raw input fields.
 */
function validateInput(rawInput = {}) {
  const rawType = (rawInput.raw_input_type || "").toLowerCase();
  const validTypes = ["photo", "text", "voice"];
  const raw_input_type = validTypes.includes(rawType) ? rawType : (rawInput.image_url || rawInput.image_path ? "photo" : "text");

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
 * 2. Resolve location using 3-tier priority:
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
 * 3. Build classification prompt for Gemini LLM.
 */
function buildPrompt(description) {
  return `You are an AI civic intake classifier for a municipal complaint management system.
Analyze the following citizen complaint description and classify it into exactly one of the supported categories.

Allowed categories: ["pothole", "garbage", "streetlight", "water_leak", "other"]

Instruction:
- Return ONLY a raw JSON object.
- Do NOT include any markdown code fences (no \`\`\`json), explanations, or preamble.
- Must include fields:
  "category": (string, must be strictly one of the allowed categories)
  "confidence": (number between 0.0 and 1.0)
  "clean_description": (string, standardized clean summary of the complaint)

Citizen Description:
"${description}"`;
}

/**
 * 4. Parse response text into structured JSON.
 */
function parseGeminiResponse(responseText) {
  if (!responseText) throw new Error("Empty response from LLM");
  let cleaned = responseText.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  return parsed;
}

/**
 * 5. Normalize category string to allowed enum values.
 */
function normalizeCategory(category) {
  if (typeof category !== 'string') return "other";
  const normalized = category.toLowerCase().trim();
  return ALLOWED_CATEGORIES.includes(normalized) ? normalized : "other";
}

/**
 * Call Gemini API via @google/genai SDK or direct REST endpoint fallback.
 */
async function callGeminiAPI(promptText, apiKey) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  // Attempt 1: Try using @google/genai SDK
  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptText
    });
    return response.text;
  } catch (sdkError) {
    // Attempt 2: Direct REST fetch fallback if SDK signature differs
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });
    if (!res.ok) {
      throw new Error(`Gemini REST API error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }
}

/**
 * 6. Classify complaint description using Gemini with 1 retry and graceful fallback.
 */
async function classifyComplaint(description) {
  const fallback = {
    category: "other",
    confidence: 0.5,
    clean_description: description
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.warn("[IntakeAgent] GEMINI_API_KEY not set. Using rule-based keyword fallback.");
    return ruleBasedClassification(description);
  }

  const promptText = buildPrompt(description);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const responseText = await callGeminiAPI(promptText, apiKey);
      const parsed = parseGeminiResponse(responseText);

      const category = normalizeCategory(parsed.category);
      let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;
      confidence = Math.max(0, Math.min(1, confidence));
      const clean_description = typeof parsed.clean_description === 'string' && parsed.clean_description.trim() 
        ? parsed.clean_description.trim() 
        : description;

      return {
        category,
        confidence,
        clean_description
      };
    } catch (err) {
      console.warn(`[IntakeAgent] Gemini classification attempt ${attempt} failed: ${err.message}`);
    }
  }

  console.warn("[IntakeAgent] All Gemini attempts failed. Returning rule-based fallback.");
  return ruleBasedClassification(description);
}

/**
 * Lightweight rule-based fallback when Gemini API key is not present or offline.
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
 * Main Intake Agent Entry Point.
 * Standardized to interface seamlessly with pipeline.js and validator.js.
 */
async function intakeAgent(incident, rawInput = {}) {
  // Step 1: Validate and sanitize raw input
  const inputData = validateInput(rawInput);

  // Step 2: Resolve Location (Reverse geocoding -> manual address -> "Unknown")
  const locationData = await resolveLocation(inputData.lat, inputData.lng, inputData.address);

  // Step 3: Classify complaint description via Gemini LLM (with retries & fallback)
  const classificationResult = await classifyComplaint(inputData.description);

  // Step 4: Construct final standardized Intake object
  return {
    raw_input_type: inputData.raw_input_type,
    description: classificationResult.clean_description,
    issue_category: classificationResult.category,
    location: locationData,
    image_url: inputData.image_url,
    confidence: classificationResult.confidence
  };
}

module.exports = intakeAgent;
