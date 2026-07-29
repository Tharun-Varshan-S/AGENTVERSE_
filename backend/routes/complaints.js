const express = require('express');
const router = express.Router();
const upload = require('../services/fileUpload');
const { runPipeline } = require('../orchestrator/pipeline');
const { runLangGraphPipeline } = require('../orchestrator/langgraphPipeline');
const Incident = require('../models/Incident');

// POST /api/complaints (Standard REST Endpoint)
router.post('/', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { description, raw_input_type, lat, lng, address } = req.body;

    const rawInput = {
      description: description || '',
      raw_input_type: raw_input_type || (req.file ? 'photo' : 'text'),
      lat: lat !== undefined && lat !== '' ? parseFloat(lat) : undefined,
      lng: lng !== undefined && lng !== '' ? parseFloat(lng) : undefined,
      address: address || '',
      image_url: req.file ? `/uploads/${req.file.filename}` : null
    };

    // Use LangGraph StateGraph pipeline
    const incident = await runLangGraphPipeline(rawInput);
    return res.status(201).json(incident);
  } catch (error) {
    console.error(`[Complaints API Error] ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
});

// POST /api/complaints/stream (Server-Sent Events Real-Time Streaming Endpoint)
router.post('/stream', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`data: ${JSON.stringify({ event, data })}\n\n`);
  };

  try {
    const { description, raw_input_type, lat, lng, address } = req.body;

    const rawInput = {
      description: description || '',
      raw_input_type: raw_input_type || (req.file ? 'photo' : 'text'),
      lat: lat !== undefined && lat !== '' ? parseFloat(lat) : undefined,
      lng: lng !== undefined && lng !== '' ? parseFloat(lng) : undefined,
      address: address || '',
      image_url: req.file ? `/uploads/${req.file.filename}` : null
    };

    sendEvent('init', { status: 'started', message: 'Initializing multi-agent graph stream...' });

    // Execute LangGraph pipeline with real-time SSE event callbacks
    const incident = await runLangGraphPipeline(rawInput, (stage, snapshot, isError) => {
      if (isError) {
        sendEvent('agent_error', { stage, error: snapshot.error });
      } else {
        sendEvent('agent_step', { stage, snapshot });
      }
    });

    sendEvent('complete', incident);
    res.end();
  } catch (error) {
    console.error(`[Complaints SSE Stream Error] ${error.message}`);
    sendEvent('error', { error: error.message });
    res.end();
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
    const { status } = req.query;
    let filter = {};
    if (status) {
      filter = {
        $or: [
          { status: status },
          { 'tracking.current_status': status }
        ]
      };
    }
    const complaints = await Incident.find(filter).sort({ created_at: -1 });
    return res.status(200).json(complaints);
  } catch (error) {
    console.error(`[Complaints API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
