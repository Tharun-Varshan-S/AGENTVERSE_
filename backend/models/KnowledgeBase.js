const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['pothole', 'garbage', 'streetlight', 'water_leak', 'other']
  },
  department_name: {
    type: String,
    required: true
  },
  service_name: {
    type: String,
    required: true
  },
  ward: {
    type: String,
    default: 'General Ward'
  },
  sla_hours: {
    type: Number,
    default: 48
  },
  officer_role: {
    type: String,
    default: 'Executive Engineer'
  },
  portal_url: {
    type: String,
    required: true
  },
  government_website: {
    type: String,
    default: 'https://civicresolve.gov.in'
  },
  escalation_chain: [{
    type: String
  }],
  keywords: [{
    type: String
  }]
});

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
