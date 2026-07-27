const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const IncidentSchema = new mongoose.Schema({
  incident_id: {
    type: String,
    unique: true,
    default: () => `INC-${uuidv4().slice(0, 8).toUpperCase()}`
  },
  status: {
    type: String,
    enum: ["intake", "routed", "drafted", "submitted", "in_progress", "escalated", "resolved"],
    default: "intake"
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  intake: {
    raw_input_type: {
      type: String,
      enum: ["photo", "text", "voice"]
    },
    description: String,
    issue_category: {
      type: String,
      enum: ["pothole", "garbage", "streetlight", "water_leak", "other"]
    },
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    image_url: String,
    confidence: Number
  },
  routing: {
    department: String,
    department_contact: String,
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"]
    },
    sla_hours: Number
  },
  draft: {
    complaint_text: String,
    reference_number: String,
    format: {
      type: String,
      enum: ["letter", "pdf_url"]
    }
  },
  tracking: {
    submitted_at: Date,
    current_status: {
      type: String,
      enum: ["submitted", "acknowledged", "in_progress", "resolved"]
    },
    last_updated: Date
  },
  escalation: {
    escalated: {
      type: Boolean,
      default: false
    },
    escalated_at: Date,
    escalation_text: String,
    escalated_to: String
  }
});

module.exports = mongoose.model('Incident', IncidentSchema);
