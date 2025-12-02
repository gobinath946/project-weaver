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
    maxlength: [2000, 'Description cannot exceed 2000 characters']
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
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Testing', 'Moved to UAT', 'Ready for Production', 'Closed', 'Reopen'],
    default: 'Open'
  },
  severity: {
    type: String,
    enum: ['None', 'Minor', 'Major', 'Critical', 'Blocker'],
    default: 'None'
  },
  classification: {
    type: String,
    enum: ['Functional Bug', 'UI Bug', 'Performance', 'Security', 'Other'],
    default: 'Functional Bug'
  },
  module: {
    type: String,
    trim: true,
    maxlength: [100, 'Module name cannot exceed 100 characters']
  },
  reproducible: {
    type: String,
    enum: ['Always', 'Sometimes', 'Rarely', 'Unable'],
    default: 'Always'
  },
  due_date: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  created_by: {
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

// Update timestamp on save
BugSchema.pre('save', function(next) {
  this.updated_at = new Date();
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
  const statuses = ['Open', 'In Progress', 'Testing', 'Moved to UAT', 'Ready for Production', 'Closed', 'Reopen'];
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
  'Open': ['In Progress', 'Closed'],
  'In Progress': ['Testing', 'Open', 'Closed'],
  'Testing': ['Moved to UAT', 'In Progress', 'Closed'],
  'Moved to UAT': ['Ready for Production', 'Testing', 'Closed'],
  'Ready for Production': ['Closed', 'Moved to UAT'],
  'Closed': ['Reopen'],
  'Reopen': ['In Progress', 'Closed']
};

module.exports = mongoose.model('Bug', BugSchema);
