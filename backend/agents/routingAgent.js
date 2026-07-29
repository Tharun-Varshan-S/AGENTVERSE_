const dotenv = require('dotenv');
dotenv.config();

const Department = require('../models/Department');

// Official Municipal Resource Portal Registry for cited source grounding
const MUNICIPAL_RESOURCE_REGISTRY = [
  {
    category: "pothole",
    portal: "Corporation Roads & Infrastructure Portal",
    url: "https://chennaicorporation.gov.in/gcc/online-services/roads",
    authority: "Executive Engineer (Roads & Bridges)",
    escalation_chain: ["Assistant Engineer (Ward)", "Executive Engineer (Zone)", "Superintending Engineer (Roads)", "Municipal Commissioner"]
  },
  {
    category: "garbage",
    portal: "Solid Waste & Sanitation Cell",
    url: "https://chennaicorporation.gov.in/gcc/online-services/swm",
    authority: "Chief Health Officer / Sanitation Inspector",
    escalation_chain: ["Sanitation Inspector (Ward)", "Zonal Health Officer", "Chief Urban Health Officer", "Additional Commissioner (Health)"]
  },
  {
    category: "streetlight",
    portal: "Electricity Board & Public Lighting Division",
    url: "https://www.tangedco.gov.in/public-lighting-grievances",
    authority: "Assistant Executive Engineer (Electrical)",
    escalation_chain: ["Junior Engineer (Electrical)", "AEE (Distribution)", "Superintending Engineer (Lighting)", "Director of Operations"]
  },
  {
    category: "water_leak",
    portal: "Metropolitan Water Supply & Sewerage Board",
    url: "https://cmwssb.tn.gov.in/grievance-redressal",
    authority: "Superintending Engineer (Water Works)",
    escalation_chain: ["Area Engineer (Ward)", "Executive Engineer (Maintenance)", "Superintending Engineer", "Managing Director (CMWSSB)"]
  },
  {
    category: "other",
    portal: "Public Grievance Redressal Portal",
    url: "https://chennaicorporation.gov.in/gcc/grievance",
    authority: "Public Relations Officer / Grievance Officer",
    escalation_chain: ["Grievance Cell Officer", "Zonal Officer", "District Collectorate Liaison", "Public Grievance Commissioner"]
  }
];

// Fallback in-memory department mapping
const fallbackDepartments = [
  { category: "pothole", ward: "Ward 1", department: "Roads & Civil Works Dept", contact: "roads-ward1@civic.gov.in" },
  { category: "pothole", ward: "Ward 2", department: "Roads & Infrastructure Dept", contact: "roads-ward2@civic.gov.in" },
  { category: "garbage", ward: "Ward 1", department: "Solid Waste Management Dept", contact: "sanitation-ward1@civic.gov.in" },
  { category: "garbage", ward: "Ward 3", department: "Public Health & Sanitation Dept", contact: "sanitation-ward3@civic.gov.in" },
  { category: "streetlight", ward: "Ward 1", department: "Electrical & Lighting Dept", contact: "lighting-ward1@civic.gov.in" },
  { category: "streetlight", ward: "Ward 2", department: "Electrical Services Dept", contact: "lighting-ward2@civic.gov.in" },
  { category: "water_leak", ward: "Ward 1", department: "Water Supply & Sewerage Board", contact: "water-ward1@civic.gov.in" },
  { category: "water_leak", ward: "Ward 3", department: "Water Works Dept", contact: "water-ward3@civic.gov.in" },
  { category: "other", ward: "Ward 1", department: "General Grievance Cell", contact: "helpline@civic.gov.in" }
];

function parseWard(address) {
  if (!address || typeof address !== 'string') return "Ward 1";
  const match = address.match(/Ward\s*(\d+)/i);
  return match ? `Ward ${match[1]}` : "Ward 1";
}

async function lookupDepartment(category, ward) {
  let dept = null;
  const normalizedCategory = category || "other";

  const mongoose = require('mongoose');
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      if (ward) dept = await Department.findOne({ category: normalizedCategory, ward }).maxTimeMS(1000);
      if (!dept) dept = await Department.findOne({ category: normalizedCategory }).maxTimeMS(1000);
      if (!dept && normalizedCategory !== 'other') dept = await Department.findOne({ category: 'other' }).maxTimeMS(1000);
    } catch (err) {
      console.warn(`[routingAgent] DB lookup notice: ${err.message}`);
    }
  }

  if (!dept) {
    const matched = fallbackDepartments.filter(d => d.category === normalizedCategory);
    dept = matched.find(d => d.ward.toLowerCase() === ward.toLowerCase()) || matched[0] || fallbackDepartments[0];
  }

  return {
    department: dept.department,
    department_contact: dept.contact
  };
}

function buildPrompt(description, category, address, department, ward) {
  return `You are an AI municipal routing officer for a smart city platform.
Analyze the complaint and assign severe risk scoring, SLA deadlines, recommended remediation actions, and officer assignments.

COMPLAINT DETAILS:
- Category: "${category}"
- Description: "${description}"
- Location: "${address}"
- Target Department: "${department}"
- Ward: "${ward}"

Return EXCLUSIVELY a JSON object with:
- "severity": one of ["low", "medium", "high", "critical"]
- "sla_hours": number (12 for critical, 24 for high, 48 for medium, 72 for low)
- "responsible_authority": string (designation of officer responsible)
- "reasoning": detailed justification of severity and SLA assignment based on public safety impact
- "recommended_actions": array of 2-4 concrete step-by-step resolution actions
- "confidence": number between 0.85 and 1.0

Do NOT include markdown formatting or backticks.`;
}

function getSlaHours(severity) {
  const mapping = { critical: 12, high: 24, medium: 48, low: 72 };
  return mapping[severity] || 48;
}

function ruleBasedRouting(description = "", category = "other") {
  const desc = description.toLowerCase();
  let severity = "medium";

  if (desc.includes("emergency") || desc.includes("live wire") || desc.includes("hazard") || desc.includes("burst") || desc.includes("flood")) {
    severity = "critical";
  } else if (desc.includes("overflow") || desc.includes("blocked") || desc.includes("leak") || desc.includes("flicker")) {
    severity = "high";
  } else if (desc.includes("pothole") || desc.includes("smell") || desc.includes("trash")) {
    severity = "medium";
  } else {
    severity = "low";
  }

  return {
    severity,
    reasoning: `Assigned ${severity.toUpperCase()} priority based on keyword safety heuristics for ${category}.`,
    recommended_actions: [
      `Dispatch field inspection team to ${category} site`,
      `Verify public safety perimeter and secure hazard area`,
      `Execute emergency remediation within mandated SLA`
    ],
    confidence: 0.88
  };
}

/**
 * Main AI Routing Agent Entry Point
 */
async function routingAgent(incident) {
  console.log("[RoutingAgent] Executing AI routing & municipal resource grounding agent...");

  const intake = incident.intake || {};
  const description = intake.description || "";
  const category = intake.issue_category || "other";
  const location = intake.location || {};
  const address = location.address || "Main City Zone";

  const ward = parseWard(address);
  const deptInfo = await lookupDepartment(category, ward);
  const resourceEntry = MUNICIPAL_RESOURCE_REGISTRY.find(r => r.category === category) || MUNICIPAL_RESOURCE_REGISTRY[4];

  let aiEvaluation = null;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (apiKey) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = buildPrompt(description, category, address, deptInfo.department, ward);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });

      let text = response.text || "";
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(text);

      if (parsed && parsed.severity) {
        aiEvaluation = {
          severity: parsed.severity.toLowerCase().trim(),
          sla_hours: parsed.sla_hours || getSlaHours(parsed.severity.toLowerCase().trim()),
          responsible_authority: parsed.responsible_authority || resourceEntry.authority,
          reasoning: parsed.reasoning || "Derived via Gemini multi-agent reasoning model.",
          recommended_actions: Array.isArray(parsed.recommended_actions) ? parsed.recommended_actions : [
            "Perform immediate on-site inspection",
            "Coordinate with ward maintenance crew",
            "Update progress on civic ledger"
          ],
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.94
        };
      }
    } catch (err) {
      console.warn(`[RoutingAgent] Gemini AI invocation notice: ${err.message}. Using rule fallback.`);
    }
  }

  if (!aiEvaluation) {
    const fallback = ruleBasedRouting(description, category);
    aiEvaluation = {
      severity: fallback.severity,
      sla_hours: getSlaHours(fallback.severity),
      responsible_authority: resourceEntry.authority,
      reasoning: fallback.reasoning,
      recommended_actions: fallback.recommended_actions,
      confidence: fallback.confidence
    };
  }

  const result = {
    department: deptInfo.department,
    department_contact: deptInfo.department_contact,
    ward: ward,
    responsible_authority: aiEvaluation.responsible_authority,
    severity: aiEvaluation.severity,
    sla_hours: aiEvaluation.sla_hours,
    reasoning: aiEvaluation.reasoning,
    recommended_actions: aiEvaluation.recommended_actions,
    confidence: aiEvaluation.confidence,
    escalation_chain: resourceEntry.escalation_chain,
    sources: [
      { title: resourceEntry.portal, url: resourceEntry.url }
    ]
  };

  console.log(`[RoutingAgent] Routed to '${result.department}' (Severity: ${result.severity}, SLA: ${result.sla_hours}h)`);
  return result;
}

module.exports = routingAgent;
