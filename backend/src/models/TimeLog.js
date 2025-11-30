const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  bugId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bug'
  },
  date: {
    type: Date,
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: 0
  },
  timePeriod: {
    start: String,
    end: String
  },
  billingType: {
    type: String,
    enum: ['Billable', 'Non_Billable'],
    required: true
  },
  notes: String,
  timesheetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timesheet'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TimeLog', timeLogSchema);
