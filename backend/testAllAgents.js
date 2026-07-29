const intakeAgent = require('./agents/intakeAgent');
const routingAgent = require('./agents/routingAgent');
const draftingAgent = require('./agents/draftingAgent');
const trackingAgent = require('./agents/trackingAgent');
const escalationAgent = require('./agents/escalationAgent');
const { validateAgentOutput } = require('./orchestrator/validator');

async function testAllAgents() {
  console.log("===============================================================");
  console.log("    AGENTVERSE END-TO-END AGENT BENCHMARK & STATUS TEST       ");
  console.log("===============================================================\n");

  const results = {};

  // 1️⃣ IntakeAgent
  console.log("1️⃣ TESTING INTAKE AGENT (Agent 1)...");
  const rawInput = {
    raw_input_type: "text",
    description: "Large deep pothole on main road causing severe traffic hazard near Ward 1",
    lat: 11.024,
    lng: 76.954,
    address: "Avinashi Road, Ward 1, Coimbatore"
  };

  const start1 = performance.now();
  try {
    const intakeOutput = await intakeAgent(null, rawInput);
    const time1 = (performance.now() - start1).toFixed(2);
    const valid1 = validateAgentOutput("intakeAgent", intakeOutput);
    results.intakeAgent = { status: "OK", timeMs: Number(time1), valid: valid1, output: intakeOutput };
    console.log(`   ✅ Status: OK (${time1} ms) | Valid: ${valid1}`);
  } catch (err) {
    results.intakeAgent = { status: "FAILED", error: err.message };
    console.log(`   ❌ Failed: ${err.message}`);
  }

  // 2️⃣ RoutingAgent
  console.log("\n2️⃣ TESTING ROUTING AGENT (Agent 2)...");
  const incidentForRouting = {
    intake: results.intakeAgent?.output || {
      description: "Large deep pothole on main road near Ward 1",
      issue_category: "pothole",
      location: { address: "Avinashi Road, Ward 1, Coimbatore" }
    }
  };

  const start2 = performance.now();
  try {
    const routingOutput = await routingAgent(incidentForRouting);
    const time2 = (performance.now() - start2).toFixed(2);
    const valid2 = validateAgentOutput("routingAgent", routingOutput);
    results.routingAgent = { status: "OK", timeMs: Number(time2), valid: valid2, output: routingOutput };
    console.log(`   ✅ Status: OK (${time2} ms) | Valid: ${valid2}`);
  } catch (err) {
    results.routingAgent = { status: "FAILED", error: err.message };
    console.log(`   ❌ Failed: ${err.message}`);
  }

  // 3️⃣ DraftingAgent
  console.log("\n3️⃣ TESTING DRAFTING AGENT (Agent 3)...");
  const incidentForDrafting = {
    incident_id: "INC-TEST-1234",
    intake: incidentForRouting.intake,
    routing: results.routingAgent?.output
  };

  const start3 = performance.now();
  try {
    const draftingOutput = await draftingAgent(incidentForDrafting);
    const time3 = (performance.now() - start3).toFixed(2);
    const valid3 = validateAgentOutput("draftingAgent", draftingOutput);
    results.draftingAgent = { status: "OK", timeMs: Number(time3), valid: valid3, output: draftingOutput };
    console.log(`   ✅ Status: OK (${time3} ms) | Valid: ${valid3}`);
  } catch (err) {
    results.draftingAgent = { status: "FAILED", error: err.message };
    console.log(`   ❌ Failed: ${err.message}`);
  }

  // 4️⃣ TrackingAgent
  console.log("\n4️⃣ TESTING TRACKING AGENT (Agent 4)...");
  const incidentForTracking = {
    incident_id: "INC-TEST-1234",
    draft: results.draftingAgent?.output,
    routing: results.routingAgent?.output
  };

  const start4 = performance.now();
  try {
    const trackingOutput = await trackingAgent(incidentForTracking);
    const time4 = (performance.now() - start4).toFixed(2);
    const valid4 = validateAgentOutput("trackingAgent", trackingOutput);
    results.trackingAgent = { status: "OK", timeMs: Number(time4), valid: valid4, output: trackingOutput };
    console.log(`   ✅ Status: OK (${time4} ms) | Valid: ${valid4}`);
  } catch (err) {
    results.trackingAgent = { status: "FAILED", error: err.message };
    console.log(`   ❌ Failed: ${err.message}`);
  }

  // 5️⃣ EscalationAgent
  console.log("\n5️⃣ TESTING ESCALATION AGENT (Agent 5)...");
  const pastDate = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72 hours ago
  const incidentForEscalation = {
    incident_id: "INC-TEST-1234",
    intake: incidentForRouting.intake,
    routing: results.routingAgent?.output,
    tracking: { submitted_at: pastDate },
    created_at: pastDate
  };

  const start5 = performance.now();
  try {
    const escalationOutput = await escalationAgent(incidentForEscalation);
    const time5 = (performance.now() - start5).toFixed(2);
    const valid5 = validateAgentOutput("escalationAgent", escalationOutput);
    results.escalationAgent = { status: "OK", timeMs: Number(time5), valid: valid5, output: escalationOutput };
    console.log(`   ✅ Status: OK (${time5} ms) | Valid: ${valid5}`);
  } catch (err) {
    results.escalationAgent = { status: "FAILED", error: err.message };
    console.log(`   ❌ Failed: ${err.message}`);
  }

  console.log("\n===============================================================");
  console.log("                        SUMMARY REPORT                         ");
  console.log("===============================================================");
  console.dir(results, { depth: 3 });
}

testAllAgents();
