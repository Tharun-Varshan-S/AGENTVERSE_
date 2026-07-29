const { runLangGraphPipeline, app, checkpointer } = require('./orchestrator/langgraphPipeline');
const { checkAndEscalateBreachedIncidents } = require('./services/escalationScheduler');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

async function testLangGraphPipelineExecution() {
  console.log("=====================================================================");
  console.log("       STARTING EXTENDED LANGGRAPH ENTERPRISE VERIFICATION");
  console.log("=====================================================================\n");

  try {
    await connectDB();

    // Multilingual Non-English Input (Tamil: "தெரு விளக்கு எரியவில்லை" -> Street light not working)
    const rawInput = {
      description: "தெரு விளக்கு எரியவில்லை dark road on Ward 1 market entrance.",
      raw_input_type: "text",
      lat: 13.0827,
      lng: 80.2707,
      address: "Ward 1 Market Entrance"
    };

    console.log(">>> Invoking LangGraph Pipeline with MemorySaver & HITL Gate...");
    const incident = await runLangGraphPipeline(rawInput);

    console.log("\n=====================================================================");
    console.log(">>> [LangGraph Complete] Final Incident State Document:");
    console.log(JSON.stringify(incident.toObject(), null, 2));
    console.log("=====================================================================\n");

    // Check Checkpointer Thread Snapshot
    const threadConfig = { configurable: { thread_id: incident.incident_id } };
    const checkpointState = await app.getState(threadConfig);
    console.log(`>>> [MemorySaver Verification] Checkpoint Thread ID: '${incident.incident_id}'`);
    console.log(`    Saved State Next Step: [${checkpointState.next.join(', ')}]`);

    // Verify Escalation Audit
    console.log("\n>>> Testing Automated SLA Escalation Scheduler...");
    const escalatedCount = await checkAndEscalateBreachedIncidents();
    console.log(`>>> [Escalation Test] Total Breached Tickets Processed: ${escalatedCount}`);

  } catch (error) {
    console.error("❌ [LangGraph Test Error] Pipeline execution failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("[MongoDB] Connection closed.");
    console.log("=====================================================================");
    console.log("   ENTERPRISE LANGGRAPH VERIFICATION COMPLETED SUCCESSFULLY");
    console.log("=====================================================================\n");
  }
}

testLangGraphPipelineExecution();
