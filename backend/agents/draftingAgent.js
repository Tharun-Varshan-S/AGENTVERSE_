const dotenv = require('dotenv');
dotenv.config();

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
const { DraftingOutputSchema, validateDraftingOutput } = require('../schemas/draftingSchema');

/**
 * LangChain ChatPromptTemplate definition with SystemMessage & HumanMessage templates.
 */
const draftingPromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a formal civic complaint documentation writer for municipal governance.
Generate an official municipal complaint letter based strictly on the provided incident data.

Instructions:
- Include a formal subject line.
- Provide an official body statement.
- Write a short professional summary of the issue.
- Extract key entities from the incident data (landmarks, dates, exact locations).
- Maintain formal, urgent, or directive tone.
- Assemble the complete complaint letter in complaint_text (make sure to explicitly reference the SLA timeframe).
- Set appropriate metadata parameters.
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
 * Validate & extract relevant input data from the Incident object.
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
 * Generate a deterministic, unique backend reference number.
 */
function generateReferenceNumber(incidentId) {
  const year = new Date().getFullYear();
  const cleanId = incidentId.startsWith("INC-") ? incidentId.replace("INC-", "") : incidentId.slice(0, 8).toUpperCase();
  return `REF-${year}-${cleanId}`;
}

/**
 * Fallback template builder if LLM API is unreachable or rate-limited.
 */
function buildFallbackDraft(data, referenceNumber) {
  const subject = `Formal Resolution Request for Reported ${data.category.toUpperCase()} Issue`;
  const body = `A public complaint has been logged regarding an active civic issue at ${data.address}.\nReported Description: "${data.description}"\n\nThe ${data.department} is requested to inspect the site and complete remediation within the mandatory ${data.slaHours}-hour SLA timeframe.`;
  
  const complaintText = `OFFICIAL MUNICIPAL CIVIC COMPLAINT NOTICE
Reference Number: ${referenceNumber}
Incident ID: ${data.incidentId}

TO: Department Head, ${data.department} (${data.departmentContact})
LOCATION: ${data.address}
CATEGORY: ${data.category.toUpperCase()}
PRIORITY SEVERITY: ${data.severity.toUpperCase()}
SLA TARGET: ${data.slaHours} Hours

SUBJECT: ${subject}

STATEMENT OF INCIDENT:
${body}

Issued by: AGENTVERSE Autonomous Civic Management System`;

  return {
    subject,
    body,
    tone: "formal",
    professional_summary: `Report of ${data.category} at ${data.address}`,
    extracted_entities: [data.category, data.department],
    complaint_text: complaintText,
    metadata: {
      sla_target_hours: data.slaHours,
      target_department: data.department,
      severity_level: data.severity === 'critical' ? 'critical' : data.severity === 'high' ? 'high' : data.severity === 'low' ? 'low' : 'medium'
    }
  };
}

/**
 * Dynamic Drafting Agent Entry Point (Agent 3) with HTTP 429 Rate Limit Alert & Zod Validation.
 */
async function draftingAgent(incident) {
  console.log("[DraftingAgent] Executing dynamic LLM document generator...");
  const data = validateInput(incident);
  const referenceNumber = generateReferenceNumber(data.incidentId);

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  let draftResult = null;

  if (apiKey) {
    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        model: modelName,
        temperature: 0.2
      });

      const structuredModel = model.withStructuredOutput(DraftingOutputSchema);
      const runnablePipeline = draftingPromptTemplate.pipe(structuredModel);

      console.log(`[DraftingAgent] Invoking LangChain Structured Output Pipeline (${modelName})...`);
      const rawResult = await runnablePipeline.invoke({
        referenceNumber,
        incidentId: data.incidentId,
        category: data.category,
        description: data.description,
        address: data.address,
        department: data.department,
        severity: data.severity,
        slaHours: data.slaHours
      });

      // Immediate runtime schema validation
      draftResult = validateDraftingOutput(rawResult);
    } catch (err) {
      const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429;
      if (isRateLimit) {
        console.warn(`⚠️ [RATE LIMIT ALERT] HTTP 429 Too Many Requests / Quota Exceeded on Gemini API (${modelName})! Using template fallback.`);
      } else {
        console.warn(`[DraftingAgent Notice] LLM Invocation Exception: ${err.message}. Using template fallback.`);
      }
    }
  }

  if (!draftResult) {
    console.log("[DraftingAgent] Utilizing formatted legal document fallback.");
    draftResult = validateDraftingOutput(buildFallbackDraft(data, referenceNumber));
  }

  const output = {
    subject: draftResult.subject,
    body: draftResult.body,
    professional_summary: draftResult.professional_summary,
    extracted_entities: draftResult.extracted_entities,
    tone: draftResult.tone,
    complaint_text: draftResult.complaint_text,
    reference_number: referenceNumber,
    format: "letter",
    metadata: draftResult.metadata
  };

  console.log(`[DraftingAgent] Generated document with Reference Number '${referenceNumber}'`);
  return output;
}

module.exports = draftingAgent;
