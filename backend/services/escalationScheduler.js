const Incident = require('../models/Incident');
const escalationAgent = require('../agents/escalationAgent');

/**
 * Automated SLA Escalation Service.
 * Periodically audits open incidents and triggers EscalationAgent for SLA breaches.
 */
async function checkAndEscalateBreachedIncidents() {
  console.log("[EscalationScheduler] Running automated SLA breach audit...");
  try {
    const now = new Date();
    
    // Find active tickets that are not resolved or rejected
    const activeIncidents = await Incident.find({
      status: { $in: ['submitted', 'routed', 'in_progress', 'drafted'] },
      'escalation.escalated': { $ne: true }
    });

    let escalatedCount = 0;

    for (const incident of activeIncidents) {
      const slaHours = incident.routing?.sla_hours || 48;
      const createdAt = new Date(incident.created_at);
      const elapsedHours = (now - createdAt) / (1000 * 60 * 60);

      if (elapsedHours >= slaHours) {
        console.log(`[EscalationScheduler] SLA Breach Detected for '${incident.incident_id}' (Elapsed: ${elapsedHours.toFixed(1)}h / SLA: ${slaHours}h)`);
        
        const escalationResult = await escalationAgent(incident);
        incident.escalation = escalationResult;
        incident.status = "escalated";
        await incident.save();

        escalatedCount++;
      }
    }

    console.log(`[EscalationScheduler] Audit Complete. Total Tickets Escalated: ${escalatedCount}`);
    return escalatedCount;
  } catch (err) {
    console.error(`[EscalationScheduler Error] Failed SLA audit: ${err.message}`);
    return 0;
  }
}

/**
 * Initialize periodic escalation timer (runs every 60 seconds).
 */
function startEscalationScheduler(intervalMs = 60000) {
  console.log(`[EscalationScheduler] Initialized background SLA escalation monitor (Interval: ${intervalMs / 1000}s)`);
  setInterval(checkAndEscalateBreachedIncidents, intervalMs);
}

module.exports = {
  checkAndEscalateBreachedIncidents,
  startEscalationScheduler
};
