const dotenv = require('dotenv');
dotenv.config();

/**
 * 1. Validate & extract relevant input data from the Incident object.
 */
function validateInput(incident = {}) {
  const incidentId = incident.incident_id || (incident._id ? incident._id.toString() : "INC-TEMP");

  const intake = incident.intake || {};
  const description = intake.description || "Civic complaint logged requiring immediate attention.";
  const category = intake.issue_category || "other";
  const address = intake.location?.address || "";

  const routing = incident.routing || {};
  const department = routing.department || "Municipal Grievance Department";
  const departmentContact = routing.department_contact || "contact@civic.gov.in";
  const severity = routing.severity || "medium";
  const slaHours = routing.sla_hours || 48;

  const tracking = incident.tracking || {};
  const submittedAt = tracking.submitted_at ? new Date(tracking.submitted_at) : (incident.created_at ? new Date(incident.created_at) : new Date());
  
  const now = new Date();
  const hoursUnresolved = Math.max(0, ((now - submittedAt) / (1000 * 60 * 60))).toFixed(1);

  return {
    incidentId,
    description,
    category,
    address,
    department,
    departmentContact,
    severity,
    slaHours,
    hoursUnresolved,
    submittedAt
  };
}

/**
 * 2. Dynamically derive higher zonal authority contact based on department or ward contact.
 */
function deriveZonalAuthority(data) {
  const contact = (data.departmentContact || "").toLowerCase();
  const dept = (data.department || "").toLowerCase();
  const addr = (data.address || "").toLowerCase();

  // Check for ward patterns (e.g., ward1, ward2, ward3, Ward 1)
  const wardMatch = addr.match(/ward\s*(\d+)/i) || contact.match(/ward\d+/i) || dept.match(/ward\d+/i);
  if (wardMatch) {
    const wardNum = wardMatch[1] || wardMatch[0].replace(/\D/g, '');
    if (wardNum) {
      return `zonal-officer-ward${wardNum}@civic.gov.in`;
    }
  }

  // Fallback zonal authority contacts based on department focus
  if (dept.includes("road") || dept.includes("infrastructure")) {
    return "zonal-infrastructure-head@civic.gov.in";
  } else if (dept.includes("waste") || dept.includes("sanitation") || dept.includes("health")) {
    return "zonal-sanitation-commissioner@civic.gov.in";
  } else if (dept.includes("electric") || dept.includes("lighting")) {
    return "zonal-superintending-engineer@civic.gov.in";
  } else if (dept.includes("water") || dept.includes("sewerage")) {
    return "zonal-water-board-director@civic.gov.in";
  }

  return "regional-officer@civic.gov.in";
}

/**
 * 3. Build prompt for Gemini LLM.
 */
function buildPrompt(data, escalatedTo) {
  return `You are an automated executive governance assistant for a municipal civic management platform.
Draft a formal escalation directive addressed to a higher zonal/district authority because a municipal department failed to resolve a complaint within the mandated SLA timeframe.

INCIDENT DETAILS:
- Incident ID: ${data.incidentId}
- Issue Category: ${data.category}
- Description: ${data.description}
- Original Responsible Department: ${data.department} (${data.departmentContact})
- Priority Severity: ${data.severity}
- Mandated SLA Target: ${data.slaHours} Hours
- Current Unresolved Duration: ${data.hoursUnresolved} Hours
- Target Higher Escalation Authority: ${escalatedTo}

INSTRUCTIONS:
- Return EXCLUSIVELY a raw JSON object with a single key "escalation_text".
- Do NOT include markdown code fences (no \`\`\`json), preamble, or postscript.
- Message must be formal, urgent, and addressed directly to ${escalatedTo}.
- State clearly that ${data.department} exceeded the mandatory ${data.slaHours}-hour SLA by ${Math.max(0, (data.hoursUnresolved - data.slaHours)).toFixed(1)} hours.
- Direct immediate site inspection and supervisory intervention.

OUTPUT JSON FORMAT:
{
  "escalation_text": "URGENT ESCALATION DIRECTIVE\\n..."
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
  if (!parsed || typeof parsed.escalation_text !== 'string' || !parsed.escalation_text.trim()) {
    throw new Error("Parsed JSON missing valid 'escalation_text' string");
  }
  return parsed.escalation_text.trim();
}

/**
 * 5. Dynamic fallback template builder when Gemini LLM is unavailable.
 */
function buildFallbackEscalationText(data, escalatedTo) {
  const breachHours = Math.max(0, (data.hoursUnresolved - data.slaHours)).toFixed(1);
  return `URGENT EXECUTIVE ESCALATION DIRECTIVE
Reference Incident: ${data.incidentId}
Target Zonal Authority: ${escalatedTo}

NOTICE OF SLA BREACH:
The civic complaint regarding "${data.category.toUpperCase()}" (${data.description}) has remained unresolved for ${data.hoursUnresolved} hours, exceeding the mandatory ${data.slaHours}-hour SLA by ${breachHours} hours.

FAILED PRIMARY DEPARTMENT:
Department: ${data.department} (${data.departmentContact})
Severity Level: ${data.severity.toUpperCase()}

SUPERVISORY ACTION REQUIRED:
Due to non-resolution by the primary department within the stipulated timeframe, administrative oversight of this ticket is hereby escalated to ${escalatedTo}. Immediate field dispatch and senior officer audit are required.

Issued by: AGENTVERSE SLA Escalation Controller`;
}

/**
 * Main Escalation Agent Entry Point (Stage 10).
 * Generates dynamic escalation directive based on incident SLA breach data.
 */
async function escalationAgent(incident = {}) {
  const data = validateInput(incident);
  const escalatedTo = deriveZonalAuthority(data);

  let escalationText = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim()) {
    const promptText = buildPrompt(data, escalatedTo);
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const responseText = await callGeminiAPI(promptText, apiKey);
        escalationText = parseGeminiResponse(responseText);
        break; // Successfully generated and parsed
      } catch (err) {
        console.warn(`[EscalationAgent] Gemini attempt ${attempt} failed: ${err.message}`);
      }
    }
  } else {
    console.warn("[EscalationAgent] GEMINI_API_KEY not set. Using dynamic template fallback.");
  }

  // Fall back to dynamic template directive if LLM failed or API key missing
  if (!escalationText) {
    escalationText = buildFallbackEscalationText(data, escalatedTo);
  }

  return {
    escalated: true,
    escalated_at: new Date(),
    escalation_text: escalationText,
    escalated_to: escalatedTo
  };
}

module.exports = escalationAgent;


  return {
    escalated: true,
    escalated_at: new Date(),
    escalation_text: escalationText,
    escalated_to: escalatedTo
  };
}

module.exports = escalationAgent;
