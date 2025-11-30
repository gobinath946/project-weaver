const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true
  },
  description: String,
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  taskListId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskList'
  },
  parentTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    required: true,
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  startDate: Date,
  dueDate: Date,
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  billEstimate: Number,
  testingEstimate: Number,
  infraDesignEstimate: Number,
  workHours: Number,
  billingType: {
    type: String,
    enum: ['Billable', 'Non_Billable'],
    default: 'Billable'
  },
  tags: [String],
  reminder: {
    enabled: { type: Boolean, default: false },
    date: Date
  },
  recurrence: {
    enabled: { type: Boolean, default: false },
    pattern: String,
    endDate: Date
  },
  outcome: String,
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
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

taskSchema.pre(/^find/, function(next) {
  this.find({ deletedAt: { $exists: false } });
  next();
});

module.exports = mongoose.model('Task', taskSchema);
