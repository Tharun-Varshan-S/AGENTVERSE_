const connectDB = require('./config/db');
const { disconnectDB } = connectDB;
const { runPipeline, runEscalation } = require('./orchestrator/pipeline');

async function testPipeline() {
  console.log("=====================================================================");
  console.log("           STARTING STAGE 1 PIPELINE VERIFICATION                    ");
  console.log("=====================================================================");
  
  // 1. Connect to DB
  await connectDB();

  // 2. Call runPipeline with dummy raw input
  const rawInput = {
    type: "text",
    content: "Broken streetlight reported near main road junction"
  };

  console.log("\n>>> Calling runPipeline(rawInput)...");
  const incidentAfterPipeline = await runPipeline(rawInput);

  // 3. Print the final incident object showing populated sections
  console.log("\n>>> [Pipeline Complete] Final Incident Object:");
  console.log(JSON.stringify(incidentAfterPipeline, null, 2));

  // 4. Call runEscalation on that incident and print the result
  console.log("\n>>> Calling runEscalation(incident_id)...");
  const incidentAfterEscalation = await runEscalation(incidentAfterPipeline.incident_id);

  console.log("\n>>> [Escalation Complete] Updated Incident Object:");
  console.log(JSON.stringify(incidentAfterEscalation, null, 2));

  // Close connection
  await disconnectDB();
  console.log("\n=====================================================================");
  console.log("        STAGE 1 VERIFICATION COMPLETED SUCCESSFULLY                  ");
  console.log("=====================================================================");
  process.exit(0);
}

testPipeline().catch((err) => {
  console.error("Test pipeline failed:", err);
  process.exit(1);
});
