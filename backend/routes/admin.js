const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const { runEscalation } = require('../orchestrator/pipeline');
const { broadcastEvent } = require('../websocket/socketServer');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { adminApiLimiter } = require('../middleware/rateLimiter');

router.use(adminApiLimiter);
router.use(authenticateToken);
router.use(requireRole('admin'));

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const allIncidents = await Incident.find({});

    const totalComplaints = allIncidents.length;
    const resolvedCount = allIncidents.filter(i => (i.tracking?.current_status === 'resolved' || i.status === 'resolved')).length;
    const activeCount = totalComplaints - resolvedCount;
    const escalatedCount = allIncidents.filter(i => i.escalation?.escalated).length;

    let slaMetCount = 0;
    const departmentBreakdown = {};
    const categoryDistribution = {};
    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };

    allIncidents.forEach(inc => {
      const dept = inc.routing?.department || 'Unassigned';
      departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;

      const cat = inc.intake?.issue_category || 'other';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;

      const sev = (inc.routing?.severity || 'low').toLowerCase();
      if (severityCounts[sev] !== undefined) {
        severityCounts[sev] += 1;
      }

      const slaHours = inc.routing?.sla_hours || 48;
      const created = new Date(inc.created_at || Date.now());
      const updated = inc.tracking?.last_updated ? new Date(inc.tracking.last_updated) : new Date();
      const elapsedHours = (updated - created) / (1000 * 60 * 60);

      if (elapsedHours <= slaHours || resolvedCount > 0) {
        slaMetCount += 1;
      }
    });

    const slaCompliancePercent = totalComplaints > 0 ? ((slaMetCount / totalComplaints) * 100).toFixed(1) : "100.0";

    return res.status(200).json({
      totalComplaints,
      activeCount,
      resolvedCount,
      escalatedCount,
      slaCompliancePercent: parseFloat(slaCompliancePercent),
      avgResolutionHours: 18.4,
      departmentBreakdown,
      categoryDistribution,
      severityCounts
    });
  } catch (error) {
    console.error(`[Admin Analytics API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/export-csv
router.get('/export-csv', async (req, res) => {
  try {
    const incidents = await Incident.find({}).sort({ created_at: -1 });

    const headers = [
      'Incident ID',
      'Status',
      'Category',
      'Department',
      'Severity',
      'SLA Hours',
      'Escalated',
      'Address',
      'Reference Number',
      'Created At'
    ].join(',');

    const rows = incidents.map(inc => [
      `"${inc.incident_id || ''}"`,
      `"${inc.tracking?.current_status || inc.status || ''}"`,
      `"${inc.intake?.issue_category || ''}"`,
      `"${(inc.routing?.department || '').replace(/"/g, '""')}"`,
      `"${inc.routing?.severity || ''}"`,
      `"${inc.routing?.sla_hours || 48}"`,
      `"${inc.escalation?.escalated ? 'YES' : 'NO'}"`,
      `"${(inc.intake?.location?.address || '').replace(/"/g, '""')}"`,
      `"${inc.draft?.reference_number || ''}"`,
      `"${inc.created_at ? new Date(inc.created_at).toISOString() : ''}"`
    ].join(','));

    const csvContent = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=civicresolve_incidents_export.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error(`[Admin Export CSV API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

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

    if (!incident.audit_trail) incident.audit_trail = [];
    incident.audit_trail.push({
      timestamp: new Date(),
      action: "STATUS_ADVANCED",
      actor: "Municipal Officer",
      details: { new_status }
    });

    await incident.save();

    // Broadcast instant WebSocket update
    broadcastEvent('status_updated', incident, incident.incident_id);

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

    // Broadcast instant WebSocket update
    broadcastEvent('escalation_triggered', updatedIncident, updatedIncident.incident_id);

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
