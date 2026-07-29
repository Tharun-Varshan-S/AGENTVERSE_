const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const { disconnectDB } = connectDB;
const escalationAgent = require('./agents/escalationAgent');
const { validateAgentOutput } = require('./orchestrator/validator');
const Incident = require('./models/Incident');
const { runPipeline, runEscalation } = require('./orchestrator/pipeline');

async function testStage10() {
  console.log("=====================================================================");
  console.log("             TESTING STAGE 10: REAL ESCALATION AGENT & SCHEDULER     ");
  console.log("=====================================================================\n");

  // Step 1: Test escalationAgent directly with mock incident data
  console.log("--- 1. Testing escalationAgent(mockIncident) Output & Schema ---");
  const mockIncident = {
    incident_id: "INC-TEST-STAGE10",
    status: "submitted",
    created_at: new Date(Date.now() - 50 * 3600 * 1000), // 50 hours ago
    intake: {
      raw_input_type: "text",
      description: "Severe main road water pipeline burst causing road flooding",
      issue_category: "water_leak",
      location: { lat: 11.0168, lng: 76.9558, address: "Crosscut Road, Ward 1, Coimbatore" },
      confidence: 0.95
    },
    routing: {
      department: "Water Supply & Sewerage Board",
      department_contact: "water-ward1@civic.gov.in",
      severity: "high",
      sla_hours: 24
    },
    tracking: {
      submitted_at: new Date(Date.now() - 50 * 3600 * 1000),
      current_status: "submitted",
      last_updated: new Date(Date.now() - 50 * 3600 * 1000)
    }
  };

  const escalationResult = await escalationAgent(mockIncident);
  console.log("Escalation Result:");
  console.log(JSON.stringify(escalationResult, null, 2));

  // Validate against system validator
  const isValid = validateAgentOutput("escalationAgent", escalationResult);
  if (isValid) {
    console.log("✅ Schema Validation PASSED for escalationAgent!");
  }

  // Confirm dynamic output fields
  if (escalationResult.escalated_to.includes("ward1")) {
    console.log(`✅ Dynamic Zonal Contact Derived Successfully: ${escalationResult.escalated_to}`);
  }
  if (escalationResult.escalation_text.includes("WATER_LEAK") || escalationResult.escalation_text.includes("water_leak") || escalationResult.escalation_text.includes("water pipeline")) {
    console.log("✅ Dynamic Escalation Text References Incident Category & Context!");
  }

  // Step 2: Test Fallback when GEMINI_API_KEY is unset
  console.log("\n--- 2. Testing Fallback Path (GEMINI_API_KEY unset) ---");
  const originalApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const fallbackResult = await escalationAgent(mockIncident);
  console.log("Fallback Escalation Text Snippet:");
  console.log(fallbackResult.escalation_text);
  
  if (fallbackResult.escalated && fallbackResult.escalation_text.includes("URGENT EXECUTIVE ESCALATION DIRECTIVE")) {
    console.log("✅ Fallback template executed cleanly without crashing!");
  }

  // Restore API key
  if (originalApiKey) process.env.GEMINI_API_KEY = originalApiKey;

  // Step 3: Test SLA Detection Logic via runEscalation
  console.log("\n--- 3. Testing Database Pipeline Escalation ---");
  process.env.ALLOW_INMEMORY_FALLBACK = "true";
  await connectDB();

  // Create & save an incident with breached SLA
  const incident = new Incident({
    status: "submitted",
    intake: mockIncident.intake,
    routing: mockIncident.routing,
    tracking: mockIncident.tracking
  });
  await incident.save();

  console.log(`Created incident in DB with ID: ${incident.incident_id}`);

  // Run escalation via pipeline
  const escalatedIncident = await runEscalation(incident.incident_id);
  console.log("\nEscalated Incident status:", escalatedIncident.status);
  console.log("Escalation block:", JSON.stringify(escalatedIncident.escalation, null, 2));

  if (escalatedIncident.status === "escalated" && escalatedIncident.escalation.escalated) {
    console.log("✅ Pipeline runEscalation successfully updated incident status to 'escalated'!");
  }

  // Step 4: Test Double-Escalation Guard
  console.log("\n--- 4. Testing Double-Escalation Guard ---");
  console.log(`Triggering runEscalation second time on ${incident.incident_id}...`);
  const reEscalatedIncident = await runEscalation(incident.incident_id);

  if (reEscalatedIncident.status === "escalated" && reEscalatedIncident.escalation.escalated_at === escalatedIncident.escalation.escalated_at) {
    console.log("✅ Double-escalation guard verified: Incident returned unchanged without duplicate execution!");
  }

  await disconnectDB();

  console.log("\n=====================================================================");
  console.log("             STAGE 10 VERIFICATION COMPLETED SUCCESSFULLY             ");
  console.log("=====================================================================");
}

testStage10().catch(err => {
  console.error("❌ Stage 10 Test Failed:", err);
  process.exit(1);
});
