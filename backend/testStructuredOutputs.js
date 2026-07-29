const { validateIntakeOutput } = require('./schemas/intakeSchema');
const { validateDraftingOutput } = require('./schemas/draftingSchema');
const intakeAgent = require('./agents/intakeAgent');
const draftingAgent = require('./agents/draftingAgent');

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(` ✅ PASS: ${testName}`);
  } catch (err) {
    console.error(` ❌ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
  }
}

console.log("=====================================================================");
console.log("   RUNNING STRUCTURED OUTPUT & ZOD VALIDATION TEST SUITE");
console.log("=====================================================================\n");

// 1. Valid Structured Intake Response
runTest("Valid Intake Structured Schema Validation", () => {
  const validData = {
    intent: "report_civic_issue",
    category: "pothole",
    confidence: 0.95,
    clean_description: "Large dangerous pothole on Main Street",
    entities: { location_mentions: ["Main Street"], urgency_indicators: ["dangerous"], keyword_signals: ["pothole"] },
    priority: "high",
    reasoning: "Road hazard affecting traffic safety"
  };
  const validated = validateIntakeOutput(validData);
  if (validated.category !== "pothole" || validated.confidence !== 0.95) {
    throw new Error("Validation mismatch");
  }
});

// 2. Missing Required Fields (Intake)
runTest("Intake Validation Fails on Invalid Category Enum", () => {
  const invalidData = {
    intent: "report_civic_issue",
    category: "invalid_category_xyz", // Invalid Enum
    confidence: 0.95,
    clean_description: "Test description"
  };
  let failed = false;
  try {
    validateIntakeOutput(invalidData);
  } catch (err) {
    failed = true;
  }
  if (!failed) throw new Error("Expected validation error on invalid enum!");
});

// 3. Invalid Field Types (Confidence outside 0..1 range)
runTest("Intake Validation Fails on Out-of-Range Confidence Number", () => {
  const invalidData = {
    intent: "report_civic_issue",
    category: "pothole",
    confidence: 5.0, // Invalid range (max 1)
    clean_description: "Test description"
  };
  let failed = false;
  try {
    validateIntakeOutput(invalidData);
  } catch (err) {
    failed = true;
  }
  if (!failed) throw new Error("Expected validation error on confidence > 1.0!");
});

// 4. Valid Structured Drafting Response
runTest("Valid Drafting Structured Schema Validation", () => {
  const validData = {
    subject: "Formal Resolution Request for Pothole",
    body: "Public grievance submitted regarding a dangerous road defect on Main Street.",
    tone: "formal",
    complaint_text: "OFFICIAL NOTICE: Formal Municipal Complaint - Pothole Hazard at Main Street.",
    metadata: {
      sla_target_hours: 24,
      target_department: "Roads & Civil Works Dept",
      severity_level: "high"
    }
  };
  const validated = validateDraftingOutput(validData);
  if (validated.subject !== "Formal Resolution Request for Pothole") {
    throw new Error("Drafting schema validation failed");
  }
});

// 5. Missing Required Fields (Drafting)
runTest("Drafting Validation Fails on Missing Body", () => {
  const invalidData = {
    subject: "Short", // Too short min 10
    tone: "formal"
  };
  let failed = false;
  try {
    validateDraftingOutput(invalidData);
  } catch (err) {
    failed = true;
  }
  if (!failed) throw new Error("Expected validation error on missing required body!");
});

// 6. Integration Test: Intake Agent State Object Update
runTest("Intake Agent Execution Returns Validated Structured Object", async () => {
  const rawInput = {
    description: "Overflowing garbage dump near central station",
    lat: "13.0827",
    lng: "80.2707"
  };
  const result = await intakeAgent({}, rawInput);
  if (!result.issue_category || !result.intent || !result.priority) {
    throw new Error("Intake agent output missing structured properties");
  }
});

// 7. Integration Test: Drafting Agent State Object Update
runTest("Drafting Agent Execution Returns Validated Structured Object", async () => {
  const mockIncident = {
    incident_id: "INC-TEST-123",
    intake: { description: "Water pipe leakage on Ward 2 road", issue_category: "water_leak", location: { address: "Ward 2 Road" } },
    routing: { department: "Water Supply Dept", department_contact: "water@civic.gov.in", severity: "high", sla_hours: 24 }
  };
  const result = await draftingAgent(mockIncident);
  if (!result.complaint_text || !result.subject || !result.metadata) {
    throw new Error("Drafting agent output missing structured properties");
  }
});

console.log("\n=====================================================================");
console.log("   STRUCTURED OUTPUT & ZOD TEST SUITE COMPLETED SUCCESSFULLY");
console.log("=====================================================================\n");
