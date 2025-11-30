const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bug title is required'],
    trim: true
  },
  description: String,
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  associatedTeam: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    required: true,
    default: 'Open'
  },
  severity: {
    type: String,
    enum: ['None', 'Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  dueDate: Date,
  relatedMilestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  module: String,
  classification: {
    type: String,
    enum: ['Functional_Bug', 'Performance_Bug', 'Security_Bug', 'UI_Bug', 'Data_Bug']
  },
  flag: {
    type: String,
    enum: ['Internal', 'External']
  },
  reproducibility: {
    type: String,
    enum: ['Always', 'Sometimes', 'Rarely', 'Unable']
  },
  tags: [String],
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date
}, {
  timestamps: true
});

bugSchema.pre(/^find/, function(next) {
  this.find({ deletedAt: { $exists: false } });
  next();
});

module.exports = mongoose.model('Bug', bugSchema);
