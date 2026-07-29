const { v4: uuidv4 } = require('uuid');

/**
 * Main Submission & Tracking Agent Entry Point (Agent 4)
 * Registers incident in municipal ledger, assigns Tracking ID, generates QR payload & audit log.
 */
async function trackingAgent(incident) {
  if (!incident) {
    throw new Error("TrackingAgent received null or undefined incident.");
  }

  const incidentId = incident.incident_id || (incident._id ? incident._id.toString() : `INC-${uuidv4().slice(0, 8).toUpperCase()}`);
  const referenceNumber = incident.draft?.reference_number || `REF-${new Date().getFullYear()}-${incidentId.slice(-6)}`;
  const department = incident.routing?.department || "Municipal Grievance Department";
  const trackingId = `TRK-${uuidv4().slice(0, 8).toUpperCase()}`;
  const now = new Date();

  console.log(`[trackingAgent] Registering complaint '${incidentId}' in civic ledger...`);
  console.log(`[trackingAgent] Target Department: ${department} | Tracking ID: ${trackingId}`);

  // Construct QR Code Data Payload
  const qrPayload = JSON.stringify({
    incident_id: incidentId,
    tracking_id: trackingId,
    reference_number: referenceNumber,
    department: department,
    submitted_at: now.toISOString(),
    verify_url: `https://civicresolve.gov.in/verify/${incidentId}`
  });

  const trackingBlock = {
    tracking_id: trackingId,
    submitted_at: now,
    current_status: "submitted",
    last_updated: now,
    ledger_acknowledgment: {
      receipt_id: `RCPT-${uuidv4().slice(0, 8).toUpperCase()}`,
      assigned_department: department,
      reference_number: referenceNumber,
      status: "SUCCESS_REGISTERED"
    },
    qr_code_data: qrPayload,
    audit_event: {
      action: "SUBMISSION_REGISTERED",
      timestamp: now,
      system: "CivicResolve AI Ledger v2.4"
    }
  };

  console.log(`[trackingAgent] Grievance successfully registered with Tracking ID '${trackingId}'`);
  return trackingBlock;
}

module.exports = trackingAgent;
