const Department = require('../models/Department');

/**
 * Dynamic Severity and SLA calculator based on complaint category & text signals.
 */
function calculateSeverityAndSLA(category, description = "") {
  const text = description.toLowerCase();
  
  if (text.includes("live wire") || text.includes("explosion") || text.includes("severe flood") || text.includes("burst main")) {
    return { severity: "critical", sla_hours: 12 };
  }

  switch (category) {
    case "pothole":
      return { severity: "high", sla_hours: 24 };
    case "water_leak":
      return { severity: "high", sla_hours: 24 };
    case "streetlight":
      return { severity: "medium", sla_hours: 48 };
    case "garbage":
      return { severity: "medium", sla_hours: 48 };
    case "other":
    default:
      return { severity: "low", sla_hours: 72 };
  }
}

/**
 * Helper to extract Ward designation from address string (e.g. "Ward 1", "Ward 2", "Ward 3").
 */
function extractWardFromAddress(address = "") {
  const match = address.match(/ward\s*(\d+)/i);
  return match ? `Ward ${match[1]}` : "Ward 1";
}

/**
 * Dynamic Department Routing Agent (Agent 2).
 * Queries MongoDB Department database using complaint category and spatial ward mapping.
 */
async function routingAgent(incident) {
  console.log("[RoutingAgent] Starting dynamic database routing query...");

  const intake = incident.intake || {};
  const category = intake.issue_category || "other";
  const description = intake.description || "";
  const address = intake.location?.address || "";

  // Step 1: Extract ward designation from geocoded address
  const targetWard = extractWardFromAddress(address);
  console.log(`[RoutingAgent] Extracted Ward: '${targetWard}' for Category: '${category}'`);

  // Step 2: Calculate SLA and Severity levels dynamically
  const { severity, sla_hours } = calculateSeverityAndSLA(category, description);

  let departmentName = null;
  let departmentContact = null;

  // Step 3: Query MongoDB Department collection dynamically
  try {
    // Attempt exact match on both Category AND Ward
    let deptMatch = await Department.findOne({ category, ward: targetWard });

    // Fall back to any department matching Category if specific ward is unmapped
    if (!deptMatch) {
      deptMatch = await Department.findOne({ category });
    }

    if (deptMatch) {
      departmentName = deptMatch.department;
      departmentContact = deptMatch.contact;
      console.log(`[RoutingAgent] Database Match Found! Department: '${departmentName}', Contact: '${departmentContact}'`);
    }
  } catch (err) {
    console.warn(`[RoutingAgent] Database query error: ${err.message}`);
  }

  // Fallback if database record is missing
  if (!departmentName) {
    departmentName = "Municipal Grievance Cell";
    departmentContact = "grievance@civic.gov.in";
  }

  const output = {
    department: departmentName,
    department_contact: departmentContact,
    severity,
    sla_hours
  };

  console.log(`[RoutingAgent] Success! Routed to '${output.department}' (Severity: ${output.severity}, SLA: ${output.sla_hours}h)`);
  return output;
}

module.exports = routingAgent;
