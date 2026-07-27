// TODO: replace with real agent logic (formal complaint letter generation, ref number assignment)

async function draftingAgent(incident) {
  const incidentId = incident ? incident.incident_id : 'INC-TEMP';
  return {
    complaint_text: `Formal Notice: Non-functional streetlight identified at Sample Address, Ward 1. Immediate maintenance requested under reference ${incidentId}.`,
    reference_number: `REF-${incidentId}`,
    format: "letter"
  };
}

module.exports = draftingAgent;
