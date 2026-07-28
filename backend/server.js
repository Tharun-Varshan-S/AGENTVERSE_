const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const { startScheduler } = require('./services/scheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static serving of uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Initialize Database & Start Server
const startServer = async () => {
  try {
    await connectDB();
    startScheduler();
    app.listen(PORT, () => {
      console.log(`[Server] Express server running on port ${PORT}`);
      console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
