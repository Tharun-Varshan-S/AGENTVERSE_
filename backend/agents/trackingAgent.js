/**
 * Main Tracking Agent Entry Point (Agent 4)
 * Receives the drafted Incident object, simulates submission, and returns tracking metadata.
 */
async function trackingAgent(incident) {
  if (!incident) {
    throw new Error("TrackingAgent received null or undefined incident.");
  }

  // Extract reference number or ID for cleaner logging
  const incidentId = incident.incident_id || (incident._id ? incident._id.toString() : "UNKNOWN");
  const referenceNumber = incident.draft?.reference_number || "N/A";
  const department = incident.routing?.department || "Municipal Grievance Department";

  console.log(`[trackingAgent] Simulating civic complaint submission to target system...`);
  console.log(`[trackingAgent] Target Department: ${department}`);
  console.log(`[trackingAgent] Incident ID: ${incidentId} | Reference Number: ${referenceNumber}`);

  const now = new Date();

  // Construct the tracking schema block
  const trackingBlock = {
    submitted_at: now,
    current_status: "submitted",
    last_updated: now
  };

  console.log(`[trackingAgent] Submission simulated successfully. Tracking block initialized.`);

  return trackingBlock;
}

module.exports = trackingAgent;
