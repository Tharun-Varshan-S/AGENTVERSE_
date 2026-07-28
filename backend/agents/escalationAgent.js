/**
 * Main Escalation Agent Entry Point (Agent 5)
 * Triggered when a complaint breaches its SLA (last_updated - submitted_at > sla_hours).
 * Determines the appropriate supervisor/zonal officer email based on the routing department and ward,
 * and drafts a clear escalation notice.
 */
async function escalationAgent(incident) {
  if (!incident) {
    throw new Error("EscalationAgent received null or undefined incident.");
  }

  const routing = incident.routing || {};
  const intake = incident.intake || {};
  const department = routing.department || "Municipal Grievance Department";
  const address = intake.location?.address || "";
  const slaHours = routing.sla_hours || 48;

  // Extract ward to dynamically route to the correct zonal officer
  const match = address.match(/Ward\s*(\d+)/i);
  const wardStr = match ? `Ward ${match[1]}` : "General Ward";

  // Determine target email contact
  const escalatedTo = match 
    ? `zonal-officer-ward${match[1]}@civic.gov.in` 
    : "regional-officer@civic.gov.in";

  const escalationText = `SLA breach detected. The complaint (ID: ${incident.incident_id || 'N/A'}) assigned to ${department} for ${wardStr} has exceeded its mandated ${slaHours}-hour SLA threshold without being resolved. Escalating ticket to Zonal Officer for review and urgent action.`;

  return {
    escalated: true,
    escalated_at: new Date(),
    escalation_text: escalationText,
    escalated_to: escalatedTo
  };
}

module.exports = escalationAgent;
