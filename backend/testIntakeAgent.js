const intakeAgent = require('./agents/intakeAgent');
const { validateAgentOutput } = require('./orchestrator/validator');

async function testIntakeAgent() {
  console.log("=================================================");
  console.log("    TESTING PRODUCTION INTAKE AGENT (AGENT 1)    ");
  console.log("=================================================\n");

  const testCases = [
    {
      name: "Case 1: Pothole complaint with coordinates",
      rawInput: {
        raw_input_type: "text",
        description: "Large deep pothole on main road causing traffic hazard near PSG Hospital",
        lat: 11.024,
        lng: 76.954
      }
    },
    {
      name: "Case 2: Garbage complaint with manual address",
      rawInput: {
        raw_input_type: "photo",
        description: "Overflowing garbage dump overflowing onto the sidewalk",
        address: "Avinashi Road, Ward 5, Coimbatore",
        image_url: "/uploads/garbage_dump.jpg"
      }
    },
    {
      name: "Case 3: Streetlight complaint without location",
      rawInput: {
        raw_input_type: "text",
        description: "Street lamp has been flickering and completely turned off since last night"
      }
    },
    {
      name: "Case 4: Water leak complaint with reverse geocoding coordinates",
      rawInput: {
        raw_input_type: "text",
        description: "Burst water pipeline leaking clean water across the street",
        lat: 13.0827,
        lng: 80.2707
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`\n--- Running ${tc.name} ---`);
    try {
      const mockIncident = { incident_id: "INC-TEST" };
      const result = await intakeAgent(mockIncident, tc.rawInput);
      
      console.log("Output:");
      console.log(JSON.stringify(result, null, 2));

      // Validate against strict validator schema
      const isValid = validateAgentOutput("intakeAgent", result);
      if (isValid) {
        console.log("✅ Schema Validation PASSED!");
      }
    } catch (err) {
      console.error(`❌ Test failed: ${err.message}`);
    }
  }

  console.log("\n=================================================");
  console.log("           INTAKE AGENT TESTING COMPLETE          ");
  console.log("=================================================");
}

testIntakeAgent();
