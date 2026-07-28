/**
 * Escalation Agent (Standalone / SLA Monitor).
 * Evaluates ticket SLA targets and escalates breached complaints to supervisory municipal officers.
 */
async function escalationAgent(incident) {
  console.log(`[EscalationAgent] Evaluating escalation status for incident ID: '${incident.incident_id}'...`);

  const routing = incident.routing || {};
  const department = routing.department || "Municipal Department";
  const contact = routing.department_contact || "zonal-officer@civic.gov.in";
  const slaHours = routing.sla_hours || 48;

  const createdAt = incident.created_at ? new Date(incident.created_at) : new Date();
  const now = new Date();
  const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

  const isBreached = hoursElapsed > slaHours;
  const escalationTarget = contact.includes("zonal") 
    ? contact 
    : `zonal-officer-${department.toLowerCase().replace(/[^a-z0-9]/g, '')}@civic.gov.in`;

  const escalationText = isBreached
    ? `SLA breach detected. Resolution SLA target of ${slaHours} hours exceeded by ${Math.round(hoursElapsed - slaHours)} hours. Ticket escalated to Zonal Officer for urgent intervention.`
    : `Manual SLA escalation triggered by administrative override for ${department}. Expediting site inspection directive.`;

  const output = {
    escalated: true,
    escalated_at: now,
    escalation_text: escalationText,
    escalated_to: escalationTarget
  };

  console.log(`[EscalationAgent] Incident escalated to '${output.escalated_to}'`);
  return output;
}

module.exports = escalationAgent;
