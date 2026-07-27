const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const { runEscalation } = require('../orchestrator/pipeline');

// POST /api/admin/complaints/:incident_id/advance-status
router.post('/complaints/:incident_id/advance-status', async (req, res) => {
  try {
    const { incident_id } = req.params;
    const { new_status } = req.body;

    const validStatuses = ["acknowledged", "in_progress", "resolved"];
    if (!new_status || !validStatuses.includes(new_status)) {
      return res.status(400).json({
        error: `Invalid new_status '${new_status}'. Allowed values: ${validStatuses.join(', ')}`
      });
    }

    let incident = await Incident.findOne({ incident_id });
    if (!incident) {
      incident = await Incident.findById(incident_id).catch(() => null);
    }
    if (!incident) {
      return res.status(404).json({ error: `Incident not found: ${incident_id}` });
    }

    if (!incident.tracking) {
      incident.tracking = {};
    }

    incident.tracking.current_status = new_status;
    incident.tracking.last_updated = new Date();
    incident.status = new_status;

    await incident.save();
    return res.status(200).json(incident);
  } catch (error) {
    console.error(`[Admin API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/complaints/:incident_id/trigger-escalation
router.post('/complaints/:incident_id/trigger-escalation', async (req, res) => {
  try {
    const { incident_id } = req.params;
    const updatedIncident = await runEscalation(incident_id);
    return res.status(200).json(updatedIncident);
  } catch (error) {
    console.error(`[Admin API Error] ${error.message}`);
    if (error.message.includes('Incident not found')) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
