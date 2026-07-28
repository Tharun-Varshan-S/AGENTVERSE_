const dotenv = require('dotenv');
dotenv.config();

/**
 * 1. Validate & extract relevant input data from the Incident object.
 */
function validateInput(incident = {}) {
  const incidentId = incident.incident_id || (incident._id ? incident._id.toString() : "INC-TEMP");

  const intake = incident.intake || {};
  const location = intake.location || {};
  const description = intake.description || "Civic complaint reported requiring municipal attention.";
  const category = intake.issue_category || "other";
  const address = location.address || "Location address not specified";

  const routing = incident.routing || {};
  const department = routing.department || "Municipal Grievance Department";
  const departmentContact = routing.department_contact || "contact@civic.gov.in";
  const severity = routing.severity || "medium";
  const slaHours = routing.sla_hours || 48;

  return {
    incidentId,
    description,
    category,
    address,
    department,
    departmentContact,
    severity,
    slaHours
  };
}

/**
 * 2. Generate a deterministic, unique backend reference number.
 *    (e.g., REF-2026-INC-A1B2C3D4 or REF-2026-94832)
 */
function generateReferenceNumber(incidentId) {
  const year = new Date().getFullYear();
  const cleanId = incidentId.startsWith("INC-") ? incidentId.replace("INC-", "") : incidentId.slice(0, 8).toUpperCase();
  return `REF-${year}-${cleanId}`;
}

/**
 * 3. Build prompt for Gemini LLM.
 */
function buildPrompt(data, referenceNumber) {
  return `You are a formal civic complaint documentation writer for municipal governance.
Generate a formal municipal complaint letter based strictly on the provided incident data.

DATA SUPPLIED:
- Reference Number: ${referenceNumber}
- Incident ID: ${data.incidentId}
- Issue Category: ${data.category}
- Incident Description: ${data.description}
- Location Address: ${data.address}
- Target Department: ${data.department}
- Priority Severity: ${data.severity}
- Service Level Agreement (SLA): ${data.slaHours} Hours

INSTRUCTIONS:
- Return EXCLUSIVELY a raw JSON object with a single key "complaint_text".
- Do NOT include any markdown code fences (no \`\`\`json), explanations, preamble, or postscript.
- The letter must follow formal government format (To Department Head, Subject, Formal Incident Details, SLA Expectations, Resolution Request).
- Do NOT hallucinate fake officer names, specific dates, or fake signatures.

OUTPUT JSON FORMAT:
{
  "complaint_text": "To\\nThe Department Head...\\n..."
}`;
}

/**
 * Call Gemini API via @google/genai SDK or REST API fallback.
 */
async function callGeminiAPI(promptText, apiKey) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
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
 * 4. Parse response text into structured JSON.
 */
function parseGeminiResponse(responseText) {
  if (!responseText) throw new Error("Empty response from LLM");
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed.complaint_text !== 'string' || !parsed.complaint_text.trim()) {
    throw new Error("Parsed JSON missing valid 'complaint_text' string");
  }
  return parsed.complaint_text.trim();
}

/**
 * 5. Build high-quality fallback complaint letter template if Gemini is unavailable or fails.
 */
function buildFallbackDraft(data, referenceNumber) {
  return `OFFICIAL MUNICIPAL CIVIC COMPLAINT NOTICE
Reference Number: ${referenceNumber}
Incident ID: ${data.incidentId}

TO: Department Head, ${data.department} (${data.departmentContact})
LOCATION: ${data.address}
CATEGORY: ${data.category.toUpperCase()}
PRIORITY SEVERITY: ${data.severity.toUpperCase()}
SLA TARGET: ${data.slaHours} Hours

SUBJECT: Formal Resolution Request for Reported ${data.category.toUpperCase()} Issue

STATEMENT OF INCIDENT:
A public complaint has been logged regarding an active civic issue at ${data.address}.
Reported Description: "${data.description}"

SERVICE LEVEL AGREEMENT DIRECTIVE:
Under current municipal governance protocols, this incident has been rated as ${data.severity.toUpperCase()} priority.
The ${data.department} is requested to inspect the site and complete remediation within the mandatory ${data.slaHours}-hour SLA timeframe.

Issued by: AGENTVERSE Autonomous Civic Management System`;
}

/**
 * 6. Validate constructed Draft object against system requirements.
 */
function validateDraft(draft) {
  if (!draft || typeof draft !== 'object') return false;
  if (typeof draft.complaint_text !== 'string' || !draft.complaint_text.trim()) return false;
  if (typeof draft.reference_number !== 'string' || !draft.reference_number.trim()) return false;
  if (draft.format !== 'letter' && draft.format !== 'pdf_url') return false;
  return true;
}

/**
 * Main Drafting Agent Entry Point (Agent 3).
 * Receives the routed Incident object, generates formal notice & reference number.
 */
async function draftingAgent(incident) {
  const data = validateInput(incident);
  const referenceNumber = generateReferenceNumber(data.incidentId);

  let complaintText = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim()) {
    const promptText = buildPrompt(data, referenceNumber);
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const responseText = await callGeminiAPI(promptText, apiKey);
        complaintText = parseGeminiResponse(responseText);
        break; // Successfully generated and parsed
      } catch (err) {
        console.warn(`[DraftingAgent] Gemini attempt ${attempt} failed: ${err.message}`);
      }
    }
  } else {
    console.warn("[DraftingAgent] GEMINI_API_KEY not set. Using professional template fallback.");
  }

  // Fall back to template notice if LLM failed or API key missing
  if (!complaintText) {
    complaintText = buildFallbackDraft(data, referenceNumber);
  }

  const result = {
    complaint_text: complaintText,
    reference_number: referenceNumber,
    format: "letter"
  };

  if (!validateDraft(result)) {
    throw new Error("DraftingAgent produced an invalid draft output block.");
  }

  return result;
}

module.exports = draftingAgent;
