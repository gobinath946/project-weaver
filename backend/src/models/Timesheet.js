const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  totalHours: {
    type: Number,
    default: 0
  },
  billableHours: {
    type: Number,
    default: 0
  },
  nonBillableHours: {
    type: Number,
    default: 0
  },
  submittedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Timesheet', timesheetSchema);
