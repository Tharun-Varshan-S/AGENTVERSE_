const express = require('express');
const router = express.Router();
const WorkflowEvent = require('../models/WorkflowEvent');
const AgentPlan = require('../models/AgentPlan');

// GET /api/workflows/:id/events?since_seq=N
router.get('/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const since_seq = req.query.since_seq ? parseInt(req.query.since_seq, 10) : undefined;
    
    const query = { workflow_id: id };
    if (since_seq !== undefined && !isNaN(since_seq)) {
      query.seq = { $gt: since_seq };
    }
    
    const events = await WorkflowEvent.find(query).sort({ seq: 1 });
    return res.status(200).json(events);
  } catch (error) {
    console.error(`[Workflow API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/workflows/:id/plans
router.get('/:id/plans', async (req, res) => {
  try {
    const { id } = req.params;
    const plans = await AgentPlan.find({ workflow_id: id }).sort({ created_at: 1 });
    return res.status(200).json(plans);
  } catch (error) {
    console.error(`[Workflow API Error] ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
