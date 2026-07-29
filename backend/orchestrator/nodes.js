const translationAgent = require('../agents/translationAgent');
const intakeAgent = require('../agents/intakeAgent');
const routingAgent = require('../agents/routingAgent');
const draftingAgent = require('../agents/draftingAgent');
const trackingAgent = require('../agents/trackingAgent');

/**
 * 0. Translation Node (Multilingual Detection & English Standardization)
 */
async function translationNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Node] Entering 'Translation Node'...");
  
  const rawDescription = state.raw_input?.description || state.raw_input?.raw_description || "";
  const translationResult = await translationAgent(rawDescription);

  console.log(`[LangGraph Node] Leaving 'Translation Node'. Language: ${translationResult.detected_language}`);
  console.log("==================================================");

  return {
    translation: translationResult,
    raw_input: {
      ...state.raw_input,
      description: translationResult.english_translation
    }
  };
}

/**
 * 1. Intake Node (Classification & OSM Reverse Geocoding)
 */
async function intakeNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Node] Entering 'Intake Node'...");

  const rawInput = state.raw_input || {};
  const mockIncident = {
    incident_id: state.incident_id,
    intake: state.intake
  };

  const intakeResult = await intakeAgent(mockIncident, rawInput);

  console.log(`[LangGraph Node] Leaving 'Intake Node'. Category: '${intakeResult.issue_category}'`);
  console.log("==================================================");

  return {
    intake: intakeResult,
    status: "intake_completed"
  };
}

/**
 * 2. Specialized Department Routing Nodes
 */
async function roadsDepartmentNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Specialized Node] Entering 'Roads & Civil Works Department Node'...");
  const mockIncident = { incident_id: state.incident_id, intake: state.intake };
  const routingResult = await routingAgent(mockIncident);
  console.log(`[LangGraph Specialized Node] Leaving 'Roads & Civil Works Node'. Dept: '${routingResult.department}'`);
  console.log("==================================================");
  return { routing: routingResult, status: "routed" };
}

async function sanitationDepartmentNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Specialized Node] Entering 'Sanitation & Solid Waste Node'...");
  const mockIncident = { incident_id: state.incident_id, intake: state.intake };
  const routingResult = await routingAgent(mockIncident);
  console.log(`[LangGraph Specialized Node] Leaving 'Sanitation Node'. Dept: '${routingResult.department}'`);
  console.log("==================================================");
  return { routing: routingResult, status: "routed" };
}

async function electricalDepartmentNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Specialized Node] Entering 'Electrical & Street Lighting Node'...");
  const mockIncident = { incident_id: state.incident_id, intake: state.intake };
  const routingResult = await routingAgent(mockIncident);
  console.log(`[LangGraph Specialized Node] Leaving 'Electrical Node'. Dept: '${routingResult.department}'`);
  console.log("==================================================");
  return { routing: routingResult, status: "routed" };
}

async function waterDepartmentNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Specialized Node] Entering 'Water Supply & Sewerage Node'...");
  const mockIncident = { incident_id: state.incident_id, intake: state.intake };
  const routingResult = await routingAgent(mockIncident);
  console.log(`[LangGraph Specialized Node] Leaving 'Water Node'. Dept: '${routingResult.department}'`);
  console.log("==================================================");
  return { routing: routingResult, status: "routed" };
}

async function generalGrievanceDepartmentNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Specialized Node] Entering 'General Grievance Department Node'...");
  const mockIncident = { incident_id: state.incident_id, intake: state.intake };
  const routingResult = await routingAgent(mockIncident);
  console.log(`[LangGraph Specialized Node] Leaving 'General Grievance Node'. Dept: '${routingResult.department}'`);
  console.log("==================================================");
  return { routing: routingResult, status: "routed" };
}

/**
 * 3. Human-in-the-Loop Officer Approval Node (HITL Gate)
 */
async function approvalNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Node] Entering 'Human-in-the-Loop Officer Approval Gate'...");

  const severity = state.routing?.severity || "medium";
  const requiresApproval = severity === "high" || severity === "critical";

  console.log(`[LangGraph Node] Severity: '${severity}'. Requires Officer Review: ${requiresApproval}`);
  console.log("==================================================");

  return {
    requires_officer_approval: requiresApproval,
    approval_status: requiresApproval ? "pending_review" : "approved"
  };
}

/**
 * 4. Drafting Node (Formal Legal Document Generator)
 */
async function draftingNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Node] Entering 'Drafting Node'...");

  const mockIncident = {
    incident_id: state.incident_id,
    intake: state.intake,
    routing: state.routing
  };

  const draftResult = await draftingAgent(mockIncident);

  console.log(`[LangGraph Node] Leaving 'Drafting Node'. Reference: '${draftResult.reference_number}'`);
  console.log("==================================================");

  return {
    draft: draftResult,
    status: "drafted"
  };
}

/**
 * 5. Tracking Node (Ticket Lifecycle Setup)
 */
async function trackingNode(state) {
  console.log("==================================================");
  console.log("[LangGraph Node] Entering 'Tracking Node'...");

  const mockIncident = {
    incident_id: state.incident_id,
    intake: state.intake,
    routing: state.routing,
    draft: state.draft
  };

  const trackingResult = await trackingAgent(mockIncident);

  console.log(`[LangGraph Node] Leaving 'Tracking Node'. Status: '${trackingResult.current_status}'`);
  console.log("==================================================");

  return {
    tracking: trackingResult,
    status: "submitted"
  };
}

module.exports = {
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
