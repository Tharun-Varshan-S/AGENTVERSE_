const translationAgent = require('../agents/translationAgent');
const intakeAgent = require('../agents/intakeAgent');
const routingAgent = require('../agents/routingAgent');
const draftingAgent = require('../agents/draftingAgent');
const trackingAgent = require('../agents/trackingAgent');
const orchestratorEngine = require('./orchestratorEngine');

/**
 * Global SSE Progress Event Emitter Callback registry for active pipelines.
 */
let globalProgressCallback = null;
function setProgressCallback(cb) {
  globalProgressCallback = cb;
}

/**
 * 0. Translation Node (Multilingual Detection & English Standardization)
 */
async function translationNode(state) {
  console.log("[LangGraph Node] Executing 'Translation Node'...");
  const rawDescription = state.raw_input?.description || state.raw_input?.raw_description || "";
  
  const result = await orchestratorEngine.executeAgentStep(
    state.incident_id,
    "Translation Agent",
    async () => await translationAgent(rawDescription),
    { raw_description: rawDescription },
    globalProgressCallback,
    ["Detecting language input...", "Standardizing input to English..."]
  );

  return {
    translation: result,
    raw_input: {
      ...state.raw_input,
      description: result.english_translation
    }
  };
}

/**
 * 1. Intake Node (Classification & Reverse Geocoding)
 */
async function intakeNode(state) {
  console.log("[LangGraph Node] Executing 'Intake Node'...");
  const rawInput = state.raw_input || {};
  const mockIncident = { incident_id: state.incident_id, intake: state.intake };

  const intakeResult = await orchestratorEngine.executeAgentStep(
    state.incident_id,
    "Intake Agent",
    async () => await intakeAgent(mockIncident, rawInput),
    rawInput,
    globalProgressCallback,
    ["Parsing multi-modal complaint...", "Extracting entities & priority...", "Checking duplicate issues..."]
  );

  return {
    intake: intakeResult,
    status: "intake_completed"
  };
}

/**
 * 2. Specialized Department Routing Nodes
 */
async function runDepartmentRoutingNode(state, deptName) {
  console.log(`[LangGraph Specialized Node] Executing '${deptName}'...`);
  const mockIncident = { incident_id: state.incident_id, intake: state.intake };

  const routingResult = await orchestratorEngine.executeAgentStep(
    state.incident_id,
    "Routing Agent",
    async () => await routingAgent(mockIncident),
    { category: state.intake?.issue_category, address: state.intake?.location?.address },
    globalProgressCallback,
    ["Querying municipal ward database...", "Searching public government portals...", "Calculating SLA hours & severity..."]
  );

  return { routing: routingResult, status: "routed" };
}

async function roadsDepartmentNode(state) {
  return runDepartmentRoutingNode(state, "Roads & Civil Works Department Node");
}

async function sanitationDepartmentNode(state) {
  return runDepartmentRoutingNode(state, "Sanitation & Solid Waste Node");
}

async function electricalDepartmentNode(state) {
  return runDepartmentRoutingNode(state, "Electrical & Street Lighting Node");
}

async function waterDepartmentNode(state) {
  return runDepartmentRoutingNode(state, "Water Supply & Sewerage Node");
}

async function generalGrievanceDepartmentNode(state) {
  return runDepartmentRoutingNode(state, "General Grievance Department Node");
}

/**
 * 3. Human-in-the-Loop Officer Approval Node (HITL Gate)
 */
async function approvalNode(state) {
  const severity = state.routing?.severity || "medium";
  const requiresApproval = severity === "high" || severity === "critical";

  return {
    requires_officer_approval: requiresApproval,
    approval_status: requiresApproval ? "pending_review" : "approved"
  };
}

/**
 * 4. Drafting Node (Formal Legal Document Generator)
 */
async function draftingNode(state) {
  console.log("[LangGraph Node] Executing 'Drafting Node'...");
  const mockIncident = {
    incident_id: state.incident_id,
    intake: state.intake,
    routing: state.routing
  };

  const draftResult = await orchestratorEngine.executeAgentStep(
    state.incident_id,
    "Drafting Agent",
    async () => await draftingAgent(mockIncident),
    { category: state.intake?.issue_category, department: state.routing?.department, severity: state.routing?.severity },
    globalProgressCallback,
    ["Assembling formal grievance notice...", "Applying category-specific tone...", "Injecting SLA target directive..."]
  );

  return {
    draft: draftResult,
    status: "drafted"
  };
}

/**
 * 5. Tracking Node (Ticket Lifecycle Setup)
 */
async function trackingNode(state) {
  console.log("[LangGraph Node] Executing 'Tracking Node'...");
  const mockIncident = {
    incident_id: state.incident_id,
    intake: state.intake,
    routing: state.routing,
    draft: state.draft
  };

  const trackingResult = await orchestratorEngine.executeAgentStep(
    state.incident_id,
    "Submission & Tracking Agent",
    async () => await trackingAgent(mockIncident),
    { incident_id: state.incident_id, reference_number: state.draft?.reference_number },
    globalProgressCallback,
    ["Registering incident in municipal ledger...", "Generating unique Tracking ID...", "Encoding QR verification payload..."]
  );

  return {
    tracking: trackingResult,
    status: "submitted"
  };
}

module.exports = {
  setProgressCallback,
  translationNode,
  intakeNode,
  roadsDepartmentNode,
  sanitationDepartmentNode,
  electricalDepartmentNode,
  waterDepartmentNode,
  generalGrievanceDepartmentNode,
  approvalNode,
  draftingNode,
  trackingNode
};
