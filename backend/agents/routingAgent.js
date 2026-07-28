const Department = require('../models/Department');

/**
 * Map issue category and text keywords to severity level and SLA target hours.
 */
function calculateSeverityAndSLA(category, description = "") {
  const text = description.toLowerCase();
  
  // Critical emergencies
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
 * Dynamic Routing Agent (Agent 2).
 * Queries Department MongoDB collection using issue category and calculates SLA parameters.
 */
async function routingAgent(incident) {
  console.log("[RoutingAgent] Starting department routing lookup...");

  const intake = incident.intake || {};
  const category = intake.issue_category || "other";
  const description = intake.description || "";

  // Step 1: Calculate severity and SLA hours
  const { severity, sla_hours } = calculateSeverityAndSLA(category, description);

  // Step 2: Attempt dynamic database lookup from Department collection
  let departmentName = null;
  let departmentContact = null;

  try {
    const deptMatch = await Department.findOne({ category });
    if (deptMatch) {
      departmentName = deptMatch.department;
      departmentContact = deptMatch.contact;
    }
  } catch (err) {
    console.warn(`[RoutingAgent] Department database lookup warning: ${err.message}`);
  }

  // Step 3: Default fallbacks if DB lookup returns null or DB is unseeded
  if (!departmentName) {
    const defaultDepartments = {
      pothole: { name: "Roads & Public Works Dept", contact: "publicworks-ward1@civic.gov.in" },
      garbage: { name: "Solid Waste Management Dept", contact: "sanitation-ward1@civic.gov.in" },
      streetlight: { name: "Electrical & Lighting Dept", contact: "lighting-ward1@civic.gov.in" },
      water_leak: { name: "Water Supply & Sewage Board", contact: "water-ward1@civic.gov.in" },
      other: { name: "Municipal Grievance Cell", contact: "grievance@civic.gov.in" }
    };
    const fallback = defaultDepartments[category] || defaultDepartments.other;
    departmentName = fallback.name;
    departmentContact = fallback.contact;
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
