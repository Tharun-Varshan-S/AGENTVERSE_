// TODO: replace with real agent logic (department matching, severity classification, SLA calculation)

async function routingAgent(incident) {
  return {
    department: "Electrical & Lighting Dept",
    department_contact: "lighting-ward1@civic.gov.in",
    severity: "medium",
    sla_hours: 48
  };
}

module.exports = routingAgent;
