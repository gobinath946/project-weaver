const mongoose = require('mongoose');

const BugSchema = new mongoose.Schema({
  bug_id: {
    type: String,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Bug title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: [
      'Open',
      'In progress',
      'Unit Testing',
      'Moved to Testing',
      'Testing in Progress',
      'Ready for UAT',
      'Ready for Production',
      'Pending Customer Response',
      'Pending Int. Resp',
      'After Production',
      'On Hold',
      'Closed'
    ],
    default: 'Open'
  },
  severity: {
    type: String,
    enum: ['None', 'Show Stopper', 'Critical', 'Major', 'Minor'],
    default: 'None'
  },
  classification: {
    type: String,
    enum: [
      'None',
      'Security',
      'Crash/Hang',
      'Data loss',
      'Performance',
      'UI/Usability',
      'Other bug',
      'Feature(New)',
      'Enhancement',
      'Functional Bug',
      'Technical Bug',
      'Requirement Not Covered',
      'Requirement Not Clear',
      'Integrating Issue'
    ],
    default: 'None'
  },
  module: {
    type: String,
    trim: true,
    maxlength: [100, 'Module name cannot exceed 100 characters']
  },
  reproducible: {
    type: String,
    enum: ['None', 'Always', 'Sometimes', 'Rarely', 'Not Applicable'],
    default: 'None'
  },
  flag: {
    type: String,
    enum: ['Internal', 'External'],
    default: 'Internal'
  },
  due_date: {
    type: Date
  },
  last_closed_time: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  linked_bugs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bug'
  }],
  associated_tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  release_milestone: {
    type: String,
    trim: true
  },
  affected_milestone: {
    type: String,
    trim: true
  },
  completion_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  last_modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
BugSchema.index({ project_id: 1 });
BugSchema.index({ task_id: 1 });
BugSchema.index({ assignee: 1 });
BugSchema.index({ reporter: 1 });
BugSchema.index({ status: 1 });
BugSchema.index({ severity: 1 });
BugSchema.index({ company_id: 1 });
BugSchema.index({ bug_id: 1 });
BugSchema.index({ due_date: 1 });
BugSchema.index({ created_at: -1 });
BugSchema.index({ classification: 1 });
BugSchema.index({ flag: 1 });
BugSchema.index({ tags: 1 });

// Update timestamp on save
BugSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Track last closed time
BugSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Closed') {
    this.last_closed_time = new Date();
  }
  next();
});

// Auto-generate bug_id before saving
BugSchema.pre('save', async function(next) {
  if (!this.bug_id) {
    try {
      const count = await mongoose.model('Bug').countDocuments({ company_id: this.company_id });
      this.bug_id = `BUG-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Static method to get bugs grouped by status for kanban
BugSchema.statics.getKanbanData = async function(query) {
  const statuses = [
    'Open',
    'In progress',
    'Unit Testing',
    'Moved to Testing',
    'Testing in Progress',
    'Ready for UAT',
    'Ready for Production',
    'Pending Customer Response',
    'Pending Int. Resp',
    'After Production',
    'On Hold',
    'Closed'
  ];
  const result = {};
  
  for (const status of statuses) {
    result[status] = await this.find({ ...query, status })
      .populate('assignee', 'first_name last_name email')
      .populate('reporter', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .sort({ updated_at: -1 });
  }
  
  return result;
};

// Valid status transitions
BugSchema.statics.validStatusTransitions = {
  'Open': ['In progress', 'Closed', 'On Hold'],
  'In progress': ['Unit Testing', 'Moved to Testing', 'Open', 'Closed', 'On Hold'],
  'Unit Testing': ['Moved to Testing', 'In progress', 'Closed', 'On Hold'],
  'Moved to Testing': ['Testing in Progress', 'In progress', 'Closed', 'On Hold'],
  'Testing in Progress': ['Ready for UAT', 'In progress', 'Closed', 'On Hold'],
  'Ready for UAT': ['Ready for Production', 'Testing in Progress', 'Closed', 'On Hold'],
  'Ready for Production': ['After Production', 'Closed', 'On Hold'],
  'Pending Customer Response': ['In progress', 'Closed', 'On Hold'],
  'Pending Int. Resp': ['In progress', 'Closed', 'On Hold'],
  'After Production': ['Closed', 'In progress'],
  'On Hold': ['Open', 'In progress', 'Closed'],
  'Closed': ['Open']
};

module.exports = mongoose.model('Bug', BugSchema);
