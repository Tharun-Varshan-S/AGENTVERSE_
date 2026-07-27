const Incident = require('../models/Incident');
const intakeAgent = require('../agents/intakeAgent');
const routingAgent = require('../agents/routingAgent');
const draftingAgent = require('../agents/draftingAgent');
const trackingAgent = require('../agents/trackingAgent');
const escalationAgent = require('../agents/escalationAgent');
const { validateAgentOutput } = require('./validator');

async function runPipeline(rawInput) {
  // 1. Create a new Incident document, status "intake"
  let incident = new Incident({
    status: "intake"
  });
  await incident.save();

  // 2. Call intakeAgent(incident, rawInput)
  try {
    const intakeResult = await intakeAgent(incident, rawInput);
    validateAgentOutput("intakeAgent", intakeResult);
    incident.intake = intakeResult;
    incident.status = "routed";
    await incident.save();
  } catch (error) {
    console.error(`[Pipeline Error] Stage 'intakeAgent' failed: ${error.message}`);
    throw new Error(`Pipeline failed at intakeAgent: ${error.message}`);
  }

  // 3. Call routingAgent(incident)
  try {
    const routingResult = await routingAgent(incident);
    validateAgentOutput("routingAgent", routingResult);
    incident.routing = routingResult;
    // status stays "routed"
    await incident.save();
  } catch (error) {
    console.error(`[Pipeline Error] Stage 'routingAgent' failed: ${error.message}`);
    throw new Error(`Pipeline failed at routingAgent: ${error.message}`);
  }

  // 4. Call draftingAgent(incident)
  try {
    const draftResult = await draftingAgent(incident);
    validateAgentOutput("draftingAgent", draftResult);
    incident.draft = draftResult;
    incident.status = "drafted";
    await incident.save();
  } catch (error) {
    console.error(`[Pipeline Error] Stage 'draftingAgent' failed: ${error.message}`);
    throw new Error(`Pipeline failed at draftingAgent: ${error.message}`);
  }

  // 5. Call trackingAgent(incident)
  try {
    const trackingResult = await trackingAgent(incident);
    validateAgentOutput("trackingAgent", trackingResult);
    incident.tracking = trackingResult;
    incident.status = "submitted";
    await incident.save();
  } catch (error) {
    console.error(`[Pipeline Error] Stage 'trackingAgent' failed: ${error.message}`);
    throw new Error(`Pipeline failed at trackingAgent: ${error.message}`);
  }

  // 6. Return the final incident document
  return incident;
}

async function runEscalation(incidentId) {
  // 1. Load the incident by incident_id (or _id)
  let incident = await Incident.findOne({ incident_id: incidentId });
  if (!incident) {
    incident = await Incident.findById(incidentId).catch(() => null);
  }

  if (!incident) {
    throw new Error(`Incident not found with ID: ${incidentId}`);
  }

  // 2. Call escalationAgent(incident)
  try {
    const escalationResult = await escalationAgent(incident);
    validateAgentOutput("escalationAgent", escalationResult);
    incident.escalation = escalationResult;
    incident.status = "escalated";
    await incident.save();
  } catch (error) {
    console.error(`[Pipeline Error] Stage 'escalationAgent' failed: ${error.message}`);
    throw new Error(`Escalation failed at escalationAgent: ${error.message}`);
  }

  // 3. Return the updated incident
  return incident;
}

module.exports = { runPipeline, runEscalation };
