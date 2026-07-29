const Incident = require('../models/Incident');
const intakeAgent = require('../agents/intakeAgent');
const routingAgent = require('../agents/routingAgent');
const draftingAgent = require('../agents/draftingAgent');
const trackingAgent = require('../agents/trackingAgent');
const escalationAgent = require('../agents/escalationAgent');
const { validateAgentOutput } = require('./validator');

/**
 * Executes the sequential multi-agent civic complaint pipeline.
 * Stages: Intake -> Routing -> Drafting -> Tracking
 */
async function runPipeline(rawInput) {
  console.log("=======================================================================");
  console.log("[Pipeline] Starting Civic Complaint Processing Pipeline...");
  console.log("=======================================================================");

  // 1. Instantiate new Incident document in database
  let incident = new Incident({ status: "intake" });
  await incident.save();
  console.log(`[Pipeline] Initialized Incident Document with ID: '${incident.incident_id}'`);

  // 2. Execute Stage 1: Intake Agent
  try {
    console.log("\n>>> STAGE 1: Executing Intake Agent...");
    const intakeResult = await intakeAgent(incident, rawInput);
    validateAgentOutput("intakeAgent", intakeResult);

    incident.intake = intakeResult;
    incident.status = "routed";
    await incident.save();
    console.log("[Pipeline] Stage 1 Completed & Persisted.");
  } catch (error) {
    console.error(`[Pipeline Critical Error] Stage 1 'intakeAgent' failed: ${error.message}`);
    throw new Error(`Pipeline failed at intakeAgent: ${error.message}`);
  }

  // 3. Execute Stage 2: Routing Agent
  try {
    console.log("\n>>> STAGE 2: Executing Routing Agent...");
    const routingResult = await routingAgent(incident);
    validateAgentOutput("routingAgent", routingResult);

    incident.routing = routingResult;
    await incident.save();
    console.log("[Pipeline] Stage 2 Completed & Persisted.");
  } catch (error) {
    console.error(`[Pipeline Critical Error] Stage 2 'routingAgent' failed: ${error.message}`);
    throw new Error(`Pipeline failed at routingAgent: ${error.message}`);
  }

  // 4. Execute Stage 3: Drafting Agent
  try {
    console.log("\n>>> STAGE 3: Executing Drafting Agent...");
    const draftResult = await draftingAgent(incident);
    validateAgentOutput("draftingAgent", draftResult);

    incident.draft = draftResult;
    incident.status = "drafted";
    await incident.save();
    console.log("[Pipeline] Stage 3 Completed & Persisted.");
  } catch (error) {
    console.error(`[Pipeline Critical Error] Stage 3 'draftingAgent' failed: ${error.message}`);
    throw new Error(`Pipeline failed at draftingAgent: ${error.message}`);
  }

  // 5. Execute Stage 4: Tracking Agent
  try {
    console.log("\n>>> STAGE 4: Executing Tracking Agent...");
    const trackingResult = await trackingAgent(incident);
    validateAgentOutput("trackingAgent", trackingResult);

    incident.tracking = trackingResult;
    incident.status = "submitted";
    await incident.save();
    console.log("[Pipeline] Stage 4 Completed & Persisted.");
  } catch (error) {
    console.error(`[Pipeline Critical Error] Stage 4 'trackingAgent' failed: ${error.message}`);
    throw new Error(`Pipeline failed at trackingAgent: ${error.message}`);
  }

  console.log("\n=======================================================================");
  console.log(`[Pipeline Success] All 4 stages completed for Incident '${incident.incident_id}'`);
  console.log("=======================================================================\n");

  return incident;
}

/**
 * Standalone SLA Escalation trigger for targeted tickets.
 */
async function runEscalation(incidentId) {
  console.log(`[Pipeline] Triggering Escalation Workflow for Incident ID: '${incidentId}'...`);

  let incident = await Incident.findOne({ incident_id: incidentId });
  if (!incident) {
    incident = await Incident.findById(incidentId).catch(() => null);
  }

  if (!incident) {
    throw new Error(`Incident not found with ID: ${incidentId}`);
  }

  // Guard against double-escalation
  if (incident.status === "escalated" || incident.escalation?.escalated) {
    console.log(`[Escalation] Incident ${incidentId} is already escalated, skipping.`);
    return incident;
  }

  try {
    const escalationResult = await escalationAgent(incident);
    validateAgentOutput("escalationAgent", escalationResult);

    incident.escalation = escalationResult;
    incident.status = "escalated";
    await incident.save();
    console.log(`[Pipeline] Escalation persisted for Incident '${incident.incident_id}'`);
    return incident;
  } catch (error) {
    console.error(`[Pipeline Critical Error] Stage 'escalationAgent' failed: ${error.message}`);
    throw new Error(`Escalation failed at escalationAgent: ${error.message}`);
  }
}

module.exports = { runPipeline, runEscalation };
