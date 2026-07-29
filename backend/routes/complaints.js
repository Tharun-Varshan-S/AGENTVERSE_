const express = require('express');
const router = express.Router();
const upload = require('../services/fileUpload');
const { executeOrchestrationPipeline } = require('../orchestrator/orchestrator');
const Incident = require('../models/Incident');

function extractRawInput(req) {
  const {
    title,
    description,
    category,
    priority,
    raw_input_type,
    lat,
    lng,
    address,
    citizen_name,
    contact,
    notes
  } = req.body;

  const fullDescription = [
    title ? `[Headline: ${title}]` : '',
    description || '',
    notes ? `[Additional Notes: ${notes}]` : ''
  ].filter(Boolean).join('\n\n');

  return {
    description: fullDescription || 'Civic issue reported',
    title: title || '',
    category: category || undefined,
    priority: priority || undefined,
    raw_input_type: raw_input_type || (req.file ? 'photo' : 'text'),
    lat: lat !== undefined && lat !== '' ? parseFloat(lat) : undefined,
    lng: lng !== undefined && lng !== '' ? parseFloat(lng) : undefined,
    address: address || '',
    image_url: req.file ? `/uploads/${req.file.filename}` : null,
    citizen_metadata: {
      name: citizen_name || (req.user ? req.user.name : 'Anonymous Citizen'),
      contact: contact || (req.user ? req.user.email : 'N/A'),
      notes: notes || ''
    }
  };
}

// POST /api/complaints (Standard REST Endpoint)
router.post('/', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const rawInput = extractRawInput(req);
    const incident = await executeOrchestrationPipeline(rawInput);

    if (rawInput.citizen_metadata) {
      incident.citizen_metadata = rawInput.citizen_metadata;
      await incident.save();
    }

    return res.status(201).json(incident);
  } catch (error) {
    console.error(`[Complaints API Error] ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
});

// POST /api/complaints/stream (Server-Sent Events Real-Time Streaming Endpoint)
router.post('/stream', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`data: ${JSON.stringify({ event, data })}\n\n`);
  };

  try {
    const rawInput = extractRawInput(req);
    sendEvent('init', { status: 'started', message: 'Initializing multi-agent pipeline stream...' });

    const incident = await executeOrchestrationPipeline(rawInput, (event, data, isError) => {
      if (isError) {
        sendEvent('agent_error', data);
      } else {
        sendEvent(event, data);
      }
    });

    if (rawInput.citizen_metadata) {
      incident.citizen_metadata = rawInput.citizen_metadata;
      await incident.save();
    }

    sendEvent('complete', incident);
    res.end();
  } catch (error) {
    console.error(`[Complaints SSE Stream Error] ${error.message}`);
    sendEvent('error', { error: error.message });
    res.end();
  }
});

// GET /api/complaints/:incident_id/events
router.get('/:incident_id/events', async (req, res) => {
  try {
    const { incident_id } = req.params;
    let incident = await Incident.findOne({ incident_id });
    if (!incident) {
      incident = await Incident.findById(incident_id).catch(() => null);
    }
    if (!incident) {
      return res.status(404).json({ error: `Incident not found: ${incident_id}` });
    }
    return res.status(200).json({
      incident_id: incident.incident_id,
      agent_logs: incident.agent_logs || [],
      audit_trail: incident.audit_trail || []
    });
  } catch (error) {
    console.error(`[Complaints Events API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/complaints/:incident_id
router.get('/:incident_id', async (req, res) => {
  try {
    const { incident_id } = req.params;
    let incident = await Incident.findOne({ incident_id });
    if (!incident) {
      incident = await Incident.findById(incident_id).catch(() => null);
    }
    if (!incident) {
      return res.status(404).json({ error: `Incident not found: ${incident_id}` });
    }
    return res.status(200).json(incident);
  } catch (error) {
    console.error(`[Complaints API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/complaints
router.get('/', async (req, res) => {
  try {
    const { status, category, severity, search } = req.query;
    let filter = {};

    if (status && status !== 'all') {
      filter.$or = [
        { status: status },
        { 'tracking.current_status': status }
      ];
    }
    if (category && category !== 'all') {
      filter['intake.issue_category'] = category;
    }
    if (severity && severity !== 'all') {
      filter['routing.severity'] = severity;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { incident_id: searchRegex },
        { 'intake.description': searchRegex },
        { 'intake.location.address': searchRegex },
        { 'routing.department': searchRegex }
      ];
    }

    const complaints = await Incident.find(filter).sort({ created_at: -1 });
    return res.status(200).json(complaints);
  } catch (error) {
    console.error(`[Complaints API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
