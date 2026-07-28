const cron = require('node-cron');
const Incident = require('../models/Incident');
const { runEscalation } = require('../orchestrator/pipeline');

/**
 * SLA Monitoring Scheduler (Stage 10)
 * Periodically checks for incidents that have breached their SLA timeframe
 * and triggers automatic escalation via the Escalation Agent.
 */
function startScheduler() {
  // Demo mode: Run every 1 minute ('* * * * *')
  // Production Note: In production deployments, change interval to every 15-30 minutes ('*/15 * * * *')
  cron.schedule('* * * * *', async () => {
    console.log('[Scheduler] Running periodic SLA monitoring tick...');

    try {
      // Find all active incidents that are neither escalated nor resolved
      const incidents = await Incident.find({
        status: { $nin: ["escalated", "resolved"] }
      });

      const now = new Date();
      let countEscalated = 0;

      for (const incident of incidents) {
        try {
          const tracking = incident.tracking || {};
          const routing = incident.routing || {};

          // Determine reference timestamp for SLA (last_updated -> submitted_at -> created_at)
          const lastUpdated = tracking.last_updated
            ? new Date(tracking.last_updated)
            : (tracking.submitted_at ? new Date(tracking.submitted_at) : new Date(incident.created_at || now));

          const slaHours = typeof routing.sla_hours === 'number' ? routing.sla_hours : 48;
          const hoursElapsed = (now - lastUpdated) / (1000 * 60 * 60);

          if (hoursElapsed > slaHours) {
            const breachDelta = (hoursElapsed - slaHours).toFixed(1);
            const incidentId = incident.incident_id || incident._id.toString();

            console.log(`[Scheduler] ${incidentId} escalated: SLA of ${slaHours}h exceeded by ${breachDelta}h`);

            // Execute escalation pipeline stage
            await runEscalation(incidentId);
            countEscalated++;
          }
        } catch (err) {
          const incidentId = incident.incident_id || (incident._id ? incident._id.toString() : "UNKNOWN");
          console.error(`[Scheduler Error] Failed to escalate incident ${incidentId}: ${err.message}`);
        }
      }

      if (countEscalated > 0) {
        console.log(`[Scheduler] Tick complete: ${countEscalated} incident(s) automatically escalated.`);
      } else {
        console.log(`[Scheduler] Tick complete: No SLA breaches detected.`);
      }
    } catch (err) {
      console.error(`[Scheduler Error] Error during SLA monitoring run: ${err.message}`);
    }
  });

  console.log('[Scheduler] SLA monitoring started (checking every 1 minute)');
}

module.exports = { startScheduler };
