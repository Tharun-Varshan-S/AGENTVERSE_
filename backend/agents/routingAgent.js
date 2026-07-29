const dotenv = require('dotenv');
dotenv.config();

const Department = require('../models/Department');

// Fallback in-memory department mapping in case DB is unpopulated or offline
const fallbackDepartments = [
  {
    category: "pothole",
    ward: "Ward 1",
    department: "Roads & Civil Works Dept",
    contact: "roads-ward1@civic.gov.in"
  },
  {
    category: "pothole",
    ward: "Ward 2",
    department: "Roads & Infrastructure Dept",
    contact: "roads-ward2@civic.gov.in"
  },
  {
    category: "garbage",
    ward: "Ward 1",
    department: "Solid Waste Management Dept",
    contact: "sanitation-ward1@civic.gov.in"
  },
  {
    category: "garbage",
    ward: "Ward 3",
    department: "Public Health & Sanitation Dept",
    contact: "sanitation-ward3@civic.gov.in"
  },
  {
    category: "streetlight",
    ward: "Ward 1",
    department: "Electrical & Lighting Dept",
    contact: "lighting-ward1@civic.gov.in"
  },
  {
    category: "streetlight",
    ward: "Ward 2",
    department: "Electrical Services Dept",
    contact: "lighting-ward2@civic.gov.in"
  },
  {
    category: "water_leak",
    ward: "Ward 1",
    department: "Water Supply & Sewerage Board",
    contact: "water-ward1@civic.gov.in"
  },
  {
    category: "water_leak",
    ward: "Ward 3",
    department: "Water Works Dept",
    contact: "water-ward3@civic.gov.in"
  },
  {
    category: "other",
    ward: "Ward 1",
    department: "General Grievance Cell",
    contact: "helpline@civic.gov.in"
  },
  {
    category: "other",
    ward: "Ward 2",
    department: "Municipal Public Cell",
    contact: "public-help@civic.gov.in"
  }
];

/**
 * 1. Parse ward number from the address.
 *    Looks for pattern like "Ward 1", "Ward 2", etc.
 */
function parseWard(address) {
  if (!address || typeof address !== 'string') return null;
  const match = address.match(/Ward\s*(\d+)/i);
  if (match) {
    return `Ward ${match[1]}`;
  }
  return null;
}

/**
 * 2. Look up the department and contact info from MongoDB,
 *    falling back to in-memory lookup if needed.
 */
async function lookupDepartment(category, ward) {
  let dept = null;
  const normalizedCategory = category || "other";

  const mongoose = require('mongoose');
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      // Attempt 1: Query MongoDB using category and ward
      if (ward) {
        dept = await Department.findOne({ category: normalizedCategory, ward }).maxTimeMS(1000);
      }
      // Attempt 2: Query MongoDB using category only (first match)
      if (!dept) {
        dept = await Department.findOne({ category: normalizedCategory }).maxTimeMS(1000);
      }
      // Attempt 3: Query MongoDB using 'other' category
      if (!dept && normalizedCategory !== 'other') {
        dept = await Department.findOne({ category: 'other' }).maxTimeMS(1000);
      }
    } catch (err) {
      console.warn(`[routingAgent] MongoDB lookup failed: ${err.message}. Using in-memory fallback.`);
    }
  }

  // Fallback to in-memory mapping if database query returns nothing
  if (!dept) {
    const matchedCategoryList = fallbackDepartments.filter(d => d.category === normalizedCategory);
    if (ward && matchedCategoryList.length > 0) {
      dept = matchedCategoryList.find(d => d.ward.toLowerCase() === ward.toLowerCase());
    }
    if (!dept && matchedCategoryList.length > 0) {
      dept = matchedCategoryList[0];
    }
    if (!dept) {
      dept = fallbackDepartments.find(d => d.category === 'other') || fallbackDepartments[0];
    }
  }

  return {
    department: dept.department,
    department_contact: dept.contact
  };
}

/**
 * 3. Build prompt for severity classification using Gemini.
 */
function buildPrompt(description, category) {
  return `You are an AI civic routing assistant. Your job is to classify the severity of a citizen's complaint.
Analyze the following complaint description and its category to determine the severity level.

Category: "${category}"
Description: "${description}"

Allowed severity values: ["low", "medium", "high", "critical"]

Instructions:
- Return ONLY a raw JSON object.
- Do NOT include any markdown code fences (no \`\`\`json), explanations, or preamble.
- Must include the field "severity" containing exactly one of the allowed severity values (all lowercase).

Example output:
{
  "severity": "medium"
}`;
}

/**
 * 4. Parse Gemini LLM response text.
 */
function parseGeminiResponse(responseText) {
  if (!responseText) throw new Error("Empty response from LLM");
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  return parsed;
}

/**
 * 5. Call Gemini API via @google/genai SDK or direct REST fetch.
 */
async function callGeminiAPI(promptText, apiKey) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptText
    });
    return response.text;
  } catch (sdkError) {
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
 * 6. Keyword-based fallback rule engine for severity.
 */
function ruleBasedSeverity(description = "") {
  const desc = description.toLowerCase();
  if (
    desc.includes("emergency") ||
    desc.includes("danger") ||
    desc.includes("live wire") ||
    desc.includes("burst") ||
    desc.includes("hazard") ||
    desc.includes("safety risk") ||
    desc.includes("fire") ||
    desc.includes("accident")
  ) {
    return "critical";
  }
  if (
    desc.includes("overflow") ||
    desc.includes("block") ||
    desc.includes("leak") ||
    desc.includes("injury") ||
    desc.includes("flicker") ||
    desc.includes("turned off") ||
    desc.includes("completely off")
  ) {
    return "high";
  }
  if (
    desc.includes("pothole") ||
    desc.includes("smell") ||
    desc.includes("dirty") ||
    desc.includes("trash") ||
    desc.includes("broken")
  ) {
    return "medium";
  }
  return "low";
}

/**
 * 7. Assign SLA hours based on severity.
 */
function getSlaHours(severity) {
  const mapping = {
    critical: 12,
    high: 24,
    medium: 48,
    low: 72
  };
  return mapping[severity] || 48;
}

/**
 * 8. Validate output structure.
 */
function validateRouting(routing) {
  const allowed = ["low", "medium", "high", "critical"];
  if (!routing || typeof routing !== 'object') return false;
  if (typeof routing.department !== 'string' || !routing.department.trim()) return false;
  if (typeof routing.department_contact !== 'string' || !routing.department_contact.trim()) return false;
  if (!allowed.includes(routing.severity)) return false;
  if (typeof routing.sla_hours !== 'number' || isNaN(routing.sla_hours)) return false;
  return true;
}

/**
 * Main Routing Agent Entry Point (Agent 2)
 */
async function routingAgent(incident) {
  const intake = incident.intake || {};
  const description = intake.description || "";
  const category = intake.issue_category || "other";
  const location = intake.location || {};
  const address = location.address || "";

  // 1. Resolve department and contact details
  const parsedWard = parseWard(address);
  const deptInfo = await lookupDepartment(category, parsedWard);

  // 2. Predict severity level (Gemini LLM with fallback)
  let severity = "medium";
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() && apiKey !== "your_gemini_api_key_here") {
    const promptText = buildPrompt(description, category);
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const responseText = await callGeminiAPI(promptText, apiKey);
        const parsed = parseGeminiResponse(responseText);
        if (parsed && parsed.severity) {
          severity = parsed.severity.toLowerCase().trim();
          break;
        }
      } catch (err) {
        console.warn(`[routingAgent] Gemini prediction attempt ${attempt} failed: ${err.message}`);
      }
    }
  } else {
    console.warn("[routingAgent] GEMINI_API_KEY is missing or placeholder. Using keyword-based fallback.");
    severity = ruleBasedSeverity(description);
  }

  // Normalize parsed severity
  const allowedSeverities = ["low", "medium", "high", "critical"];
  if (!allowedSeverities.includes(severity)) {
    severity = ruleBasedSeverity(description);
  }

  // 3. Assign SLA Hours
  const slaHours = getSlaHours(severity);

  // 4. Construct result routing block
  const result = {
    department: deptInfo.department,
    department_contact: deptInfo.department_contact,
    severity: severity,
    sla_hours: slaHours
  };

  // 5. Final validation check
  if (!validateRouting(result)) {
    throw new Error("routingAgent produced an invalid routing output block.");
  }

  return result;
}

module.exports = routingAgent;
