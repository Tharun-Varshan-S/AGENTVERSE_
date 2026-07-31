const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const Workflow = require('../models/Workflow');
require('dotenv').config();

async function compareState(incidentId) {
  if (!incidentId) {
    console.error('Usage: node compareWorkflowEngineState.js <incidentId>');
    process.exit(1);
  }

  try {
    let pipelineStatus = 'NOT FOUND';
    let engineState = 'NOT FOUND';

    try {
      // Try hitting the debug API first in case of in-memory fallback
      const http = require('http');
      const data = await new Promise((resolve, reject) => {
        http.get(`http://localhost:5000/api/debug/state/${incidentId}`, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
      });
      pipelineStatus = data.incident;
      engineState = data.workflow;
    } catch (apiErr) {
      // Fallback to mongo directly
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civic_resolve');
      const incident = await Incident.findOne({ incident_id: incidentId });
      const workflow = await Workflow.findOne({ workflow_id: incidentId });
      pipelineStatus = incident ? incident.status : 'NOT FOUND';
      engineState = workflow ? workflow.state : 'NOT FOUND';
    }
    
    console.log('\n--- State Comparison ---');
    console.log(`Incident ID : ${incidentId}`);
    console.log('------------------------');
    
    console.log(`Pipeline Status (Incident.status) : ${pipelineStatus}`);
    console.log(`Engine State    (Workflow.state)  : ${engineState}`);
    console.log('------------------------');
    
    if (pipelineStatus !== 'NOT FOUND' && engineState !== 'NOT FOUND') {
      console.log('Match? : ' + ((pipelineStatus.toUpperCase() === engineState || 
          (pipelineStatus === 'in_progress' && ['UNDERSTANDING', 'CLASSIFICATION', 'PRIORITY', 'ROUTING', 'POLICY_VALIDATION', 'DUPLICATE_CHECK', 'DRAFTING', 'QUALITY_REVIEW'].includes(engineState))) ? 'Y (Equivalent Phase)' : 'N'));
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

const arg = process.argv[2];
compareState(arg);
