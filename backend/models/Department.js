const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  ward: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Department', DepartmentSchema);
