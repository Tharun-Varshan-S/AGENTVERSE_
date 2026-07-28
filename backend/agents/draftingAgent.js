const dotenv = require('dotenv');
dotenv.config();

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
const { z } = require('zod');

// 1. Zod Schema for Structured Output
const DraftOutputSchema = z.object({
  complaint_text: z.string().min(20)
    .describe("The formal municipal complaint letter following official governance structure")
});

/**
 * 2. LangChain ChatPromptTemplate definition with SystemMessage & HumanMessage templates.
 * Enforces structured generation of formal government complaint notices.
 */
const draftingPromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a formal civic complaint documentation writer for municipal governance.
Generate an official municipal complaint letter based strictly on the provided incident data.

Instructions:
- The letter must follow formal government format (To Department Head, Subject, Formal Incident Details, SLA Expectations, Resolution Request).
- Maintain professional tone.
- Do NOT hallucinate fake officer names, specific dates, or fake signatures.`
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `INCIDENT DATA:
- Reference Number: {referenceNumber}
- Incident ID: {incidentId}
- Issue Category: {category}
- Description: {description}
- Location Address: {address}
- Target Department: {department}
- Priority Severity: {severity}
- SLA Target: {slaHours} Hours`
  )
]);

/**
 * 3. Validate & extract relevant input data from the Incident object.
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
 * 4. Generate a deterministic, unique backend reference number.
 */
function generateReferenceNumber(incidentId) {
  const year = new Date().getFullYear();
  const cleanId = incidentId.startsWith("INC-") ? incidentId.replace("INC-", "") : incidentId.slice(0, 8).toUpperCase();
  return `REF-${year}-${cleanId}`;
}

/**
 * 5. High-quality fallback template builder if LLM API is unavailable.
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
 * Main Drafting Agent Entry Point (Agent 3).
 * Receives the routed Incident object, generates formal notice & reference number.
 */
async function draftingAgent(incident) {
  console.log("[DraftingAgent] Starting document generation...");
  const data = validateInput(incident);
  const referenceNumber = generateReferenceNumber(data.incidentId);

  let complaintText = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim()) {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    try {
      // LangChain Chat Model initialization
      const model = new ChatGoogleGenerativeAI({
        apiKey,
        modelName,
        temperature: 0.2
      });

      // Runnable LCEL Pipeline with Zod Structured Output
      const structuredModel = model.withStructuredOutput(DraftOutputSchema);
      const runnablePipeline = draftingPromptTemplate.pipe(structuredModel);

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[DraftingAgent] Invoking LangChain LCEL pipeline (Attempt ${attempt})...`);
          const result = await runnablePipeline.invoke({
            referenceNumber,
            incidentId: data.incidentId,
            category: data.category,
            description: data.description,
            address: data.address,
            department: data.department,
            severity: data.severity,
            slaHours: data.slaHours
          });

          if (result && result.complaint_text) {
            complaintText = result.complaint_text;
            break;
          }
        } catch (err) {
          console.warn(`[DraftingAgent] LangChain attempt ${attempt} failed: ${err.message}`);
        }
      }
    } catch (initErr) {
      console.warn(`[DraftingAgent] LangChain initialization failed: ${initErr.message}`);
    }
  } else {
    console.warn("[DraftingAgent] GEMINI_API_KEY not configured. Using template fallback.");
  }

  // Fall back to template notice if LLM execution failed or API key missing
  if (!complaintText) {
    console.log("[DraftingAgent] Using fallback document template.");
    complaintText = buildFallbackDraft(data, referenceNumber);
  }

  const result = {
    complaint_text: complaintText,
    reference_number: referenceNumber,
    format: "letter"
  };

  console.log(`[DraftingAgent] Success! Document generated with Reference Number '${referenceNumber}'`);
  return result;
}

module.exports = draftingAgent;
