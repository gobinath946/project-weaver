const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: String,
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  startDate: Date,
  endDate: Date,
  budget: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'on_hold', 'completed', 'archived'],
    default: 'active'
  },
  teamMembers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  customStatuses: [{
    name: String,
    color: String,
    type: {
      type: String,
      enum: ['task', 'bug']
    },
    order: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date
}, {
  timestamps: true
});

projectSchema.pre(/^find/, function(next) {
  this.find({ deletedAt: { $exists: false } });
  next();
});

module.exports = mongoose.model('Project', projectSchema);
