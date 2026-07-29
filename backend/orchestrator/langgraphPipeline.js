const { StateGraph, START, END, MemorySaver } = require('@langchain/langgraph');
const { CivicWorkflowState } = require('./state');
const { 
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
} = require('./nodes');
const Incident = require('../models/Incident');

/**
 * Conditional Edge Router Function.
 * Evaluates state.intake.issue_category dynamically and determines graph branch path.
 */
function routeByDepartment(state) {
  const category = state.intake?.issue_category;
  console.log(`[LangGraph Conditional Router] Evaluating branch decision for category: '${category}'`);

  switch (category) {
    case "pothole":
      return "roadsDepartmentNode";
    case "garbage":
      return "sanitationDepartmentNode";
    case "streetlight":
      return "electricalDepartmentNode";
    case "water_leak":
      return "waterDepartmentNode";
    case "other":
    default:
      return "generalGrievanceDepartmentNode";
  }
}

/**
 * Construct LangGraph StateGraph with Memory Checkpointer & Approval Gate.
 */
const checkpointer = new MemorySaver();

const workflow = new StateGraph(CivicWorkflowState)
  .addNode("translationNode", translationNode)
  .addNode("intakeNode", intakeNode)
  .addNode("roadsDepartmentNode", roadsDepartmentNode)
  .addNode("sanitationDepartmentNode", sanitationDepartmentNode)
  .addNode("electricalDepartmentNode", electricalDepartmentNode)
  .addNode("waterDepartmentNode", waterDepartmentNode)
  .addNode("generalGrievanceDepartmentNode", generalGrievanceDepartmentNode)
  .addNode("approvalNode", approvalNode)
  .addNode("draftingNode", draftingNode)
  .addNode("trackingNode", trackingNode)
  
  .addEdge(START, "translationNode")
  .addEdge("translationNode", "intakeNode")
  .addConditionalEdges("intakeNode", routeByDepartment, {
    roadsDepartmentNode: "roadsDepartmentNode",
    sanitationDepartmentNode: "sanitationDepartmentNode",
    electricalDepartmentNode: "electricalDepartmentNode",
    waterDepartmentNode: "waterDepartmentNode",
    generalGrievanceDepartmentNode: "generalGrievanceDepartmentNode"
  })
  .addEdge("roadsDepartmentNode", "approvalNode")
  .addEdge("sanitationDepartmentNode", "approvalNode")
  .addEdge("electricalDepartmentNode", "approvalNode")
  .addEdge("waterDepartmentNode", "approvalNode")
  .addEdge("generalGrievanceDepartmentNode", "approvalNode")
  .addEdge("approvalNode", "draftingNode")
  .addEdge("draftingNode", "trackingNode")
  .addEdge("trackingNode", END);

/**
 * Compile StateGraph with Memory Checkpointer.
 */
const app = workflow.compile({ checkpointer });

/**
 * Main LangGraph Orchestration Entry Point with thread checkpointing & SSE progress callbacks.
 */
async function runLangGraphPipeline(rawInput, onProgressCallback = null) {
  console.log("=======================================================================");
  console.log("[LangGraph Orchestrator] Starting Memory-Checkpointed StateGraph Execution...");
  console.log("=======================================================================");

  let incident = new Incident({ status: "intake" });
  await incident.save();
  console.log(`[LangGraph Orchestrator] Created DB Incident Document: '${incident.incident_id}'`);

  const initialState = {
    incident_id: incident.incident_id,
    raw_input: rawInput,
    status: "intake",
    errors: []
  };

  const config = {
    configurable: { thread_id: incident.incident_id }
  };

  if (typeof onProgressCallback === 'function') {
    onProgressCallback("start", { incident_id: incident.incident_id, status: "intake" }, false);
  }

  let finalState;
  try {
    // Invoke graph with thread_id checkpointing
    finalState = await app.invoke(initialState, config);
    
    if (typeof onProgressCallback === 'function') {
      onProgressCallback("complete", finalState, false);
    }
  } catch (err) {
    console.error(`[LangGraph Orchestrator Critical Failure] Graph execution halted: ${err.message}`);
    incident.status = "failed";
    await incident.save();

    if (typeof onProgressCallback === 'function') {
      onProgressCallback("error", { error: err.message }, true);
    }
    throw err;
  }

  // Persist updated state back to MongoDB
  incident.intake = finalState.intake;
  incident.routing = finalState.routing;
  incident.draft = finalState.draft;
  incident.tracking = finalState.tracking;
  incident.status = finalState.status || "submitted";

  await incident.save();

  console.log("=======================================================================");
  console.log(`[LangGraph Orchestrator Success] Checkpointed Graph Complete for '${incident.incident_id}'`);
  console.log("=======================================================================\n");

  return incident;
}

module.exports = {
  runLangGraphPipeline,
  app,
  workflow,
  checkpointer,
  routeByDepartment
};
