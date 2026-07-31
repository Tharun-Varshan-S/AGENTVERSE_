const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const workflowRoutes = require('./routes/workflows');
const { startScheduler } = require('./services/scheduler');
const { initWebSocketServer, broadcastEvent } = require('./websocket/socketServer');
const eventBus = require('./eventbus/EventBus');

// Initialize WorkflowEngine (observer only, gated by feature flag)
require('./engine/WorkflowEngine');

const app = express();
const server = http.createServer(app);

// Tail EventBus live via WebSockets for workflows
eventBus.on('*', (payload) => {
  if (payload.event !== 'status_updated' && payload.event !== 'escalation_triggered') {
    // Only broadcast internal workflow events to workflow subscribers
    // The payload.incident_id maps to workflow_id
    broadcastEvent('workflow_event', payload, null, payload.incident_id);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static serving of uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workflows', workflowRoutes);
// Temporary debug endpoint for testing in-memory fallback
app.get('/api/debug/state/:id', async (req, res) => {
  const Incident = require('./models/Incident');
  const Workflow = require('./models/Workflow');
  const incident = await Incident.findOne({ incident_id: req.params.id });
  const workflow = await Workflow.findOne({ workflow_id: req.params.id });
  res.json({
    incident: incident ? incident.status : 'NOT FOUND',
    workflow: workflow ? workflow.state : 'NOT FOUND'
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "ok", websocket: "enabled" });
});

// Initialize WebSocket Server
initWebSocketServer(server);

// Port configuration
const PORT = process.env.PORT || 5000;

// Initialize Database & Start Server
const startServer = async () => {
  try {
    await connectDB();
    if (process.env.ALLOW_INMEMORY_FALLBACK === 'true') {
      const Admin = require('./models/Admin');
      const CapabilityAllowlist = require('./models/CapabilityAllowlist');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('admin123', salt);
      await Admin.findOneAndUpdate(
        { admin_id: 'ADMIN001' },
        { 
          name: 'Chief Municipal Admin', 
          email: 'admin@civicresolve.gov.in',
          password_hash: password_hash, 
          department: 'Central Municipal Operations', 
          role: 'superadmin'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log('[Seed] Admin account ensured for in-memory fallback.');
      
      const allowlists = [
        { agent_type: 'intake_agent', capabilities: ['LLM'], services: [], external_apis: ['Nominatim Reverse Geocoding'] },
        { agent_type: 'routing_agent', capabilities: ['LLM'], services: [{ service: 'DepartmentRepository', operations: ['findOne'] }], external_apis: [] },
        { agent_type: 'drafting_agent', capabilities: ['LLM'], services: [], external_apis: [] },
        { agent_type: 'escalation_agent', capabilities: ['LLM'], services: [], external_apis: [] },
        { agent_type: 'submission_&_tracking_agent', capabilities: [], services: [], external_apis: [] },
        { agent_type: 'translation_agent', capabilities: ['LLM', 'Translation'], services: [], external_apis: [] },
        { agent_type: 'understanding_agent', capabilities: ['LLM'], services: [], external_apis: [] },
        { agent_type: 'classification_agent', capabilities: ['LLM'], services: [], external_apis: [] },
        { agent_type: 'priority_agent', capabilities: [], services: [], external_apis: [] },
        { agent_type: 'policy_validation_agent', capabilities: ['PII Detection'], services: [], external_apis: [] },
        { agent_type: 'duplicate_detection_agent', capabilities: [], services: [{ service: 'ComplaintRepository', operations: ['find'] }], external_apis: [] },
        { agent_type: 'quality_review_agent', capabilities: [], services: [], external_apis: [] }
      ];
      for (const entry of allowlists) {
        await CapabilityAllowlist.findOneAndUpdate(
          { agent_type: entry.agent_type },
          entry,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log('[Seed] Capability allowlists seeded for in-memory fallback.');
    }
    startScheduler();
    server.listen(PORT, () => {
      console.log(`[Server] Express & WebSocket server running on port ${PORT}`);
      console.log(`[Server] WebSocket path: ws://localhost:${PORT}/ws`);
      console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
