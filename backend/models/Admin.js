const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  admin_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: 'General Governance'
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin', 'officer'],
    default: 'admin'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Admin', AdminSchema);
