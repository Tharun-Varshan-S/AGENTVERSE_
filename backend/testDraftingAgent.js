const draftingAgent = require('./agents/draftingAgent');
const { validateAgentOutput } = require('./orchestrator/validator');

async function testDraftingAgent() {
  console.log("=================================================");
  console.log("   TESTING PRODUCTION DRAFTING AGENT (AGENT 3)   ");
  console.log("=================================================\n");

  const mockIncident = {
    incident_id: "INC-88A91B2C",
    status: "routed",
    intake: {
      raw_input_type: "text",
      description: "Severe pothole on main road causing vehicle damage and safety risk near PSG Hospital",
      issue_category: "pothole",
      location: {
        lat: 11.024,
        lng: 76.954,
        address: "Avinashi Road near PSG Hospital, Coimbatore"
      },
      confidence: 0.95
    },
    routing: {
      department: "Roads & Infrastructure Department",
      department_contact: "roads-ward1@civic.gov.in",
      severity: "high",
      sla_hours: 24
    }
  };

  console.log("Mock Routed Incident Data:");
  console.log(JSON.stringify(mockIncident, null, 2));

  console.log("\n--- Invoking draftingAgent(mockIncident) ---");
  try {
    const draftResult = await draftingAgent(mockIncident);

    console.log("\nGenerated Draft Result:");
    console.log(JSON.stringify(draftResult, null, 2));

    // Validate against system validator
    const isValid = validateAgentOutput("draftingAgent", draftResult);
    if (isValid) {
      console.log("\n✅ Schema Validation PASSED for draftingAgent!");
    }
  } catch (err) {
    console.error(`❌ Test failed: ${err.message}`);
  }

  console.log("\n=================================================");
  console.log("          DRAFTING AGENT TESTING COMPLETE        ");
  console.log("=================================================");
}

testDraftingAgent();
