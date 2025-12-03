const mongoose = require('mongoose');

// Project Status Enum
const PROJECT_STATUS = [
  'Active',
  'In Progress',
  'On Track',
  'Delayed',
  'In Testing',
  'On Hold',
  'Approved',
  'Cancelled',
  'Planning',
  'Completed',
  'Invoiced',
  'Yet to Start',
  'Compl Yet to Mov',
  'Waiting for Live Input'
];

const ProjectSchema = new mongoose.Schema({
  project_id: {
    type: String,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  team_members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  allocated_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  allocated_time: {
    type: Number,
    default: 0,
    min: 0
  },
  no_of_allocated_users: {
    type: Number,
    default: 0
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  status: {
    type: String,
    enum: PROJECT_STATUS,
    default: 'Active'
  },
  visibility: {
    type: String,
    enum: ['Private', 'Public'],
    default: 'Private'
  },
  strict_project: {
    type: Boolean,
    default: false
  },
  project_group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectGroup'
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  task_count: {
    type: Number,
    default: 0
  },
  bug_count: {
    type: Number,
    default: 0
  },
  completed_task_count: {
    type: Number,
    default: 0
  },
  closed_bug_count: {
    type: Number,
    default: 0
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
ProjectSchema.index({ company_id: 1 });
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ team_members: 1 });
ProjectSchema.index({ project_id: 1 });
ProjectSchema.index({ created_at: -1 });
ProjectSchema.index({ visibility: 1 });
ProjectSchema.index({ project_group: 1 });
ProjectSchema.index({ strict_project: 1 });
ProjectSchema.index({ allocated_users: 1 });

// Update timestamp on save
ProjectSchema.pre('save', function(next) {
  this.updated_at = new Date();
  // Auto-calculate no_of_allocated_users
  if (this.allocated_users) {
    this.no_of_allocated_users = this.allocated_users.length;
  }
  next();
});

// Auto-generate project_id before saving
ProjectSchema.pre('save', async function(next) {
  if (!this.project_id) {
    try {
      const count = await mongoose.model('Project').countDocuments({ company_id: this.company_id });
      this.project_id = `PR-${String(count + 1).padStart(3, '0')}`;
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Calculate progress based on completed tasks
ProjectSchema.methods.calculateProgress = function() {
  if (this.task_count === 0) return 0;
  return Math.round((this.completed_task_count / this.task_count) * 100);
};

// Update task counts
ProjectSchema.methods.updateTaskCounts = async function() {
  const Task = mongoose.model('Task');
  const totalTasks = await Task.countDocuments({ project_id: this._id });
  const completedTasks = await Task.countDocuments({ project_id: this._id, status: 'Completed' });
  
  this.task_count = totalTasks;
  this.completed_task_count = completedTasks;
  this.progress = this.calculateProgress();
  await this.save();
};

// Update bug counts
ProjectSchema.methods.updateBugCounts = async function() {
  const Bug = mongoose.model('Bug');
  const totalBugs = await Bug.countDocuments({ project_id: this._id });
  const closedBugs = await Bug.countDocuments({ project_id: this._id, status: 'Closed' });
  
  this.bug_count = totalBugs;
  this.closed_bug_count = closedBugs;
  await this.save();
};

// Export status enum for use in other files
ProjectSchema.statics.PROJECT_STATUS = PROJECT_STATUS;

module.exports = mongoose.model('Project', ProjectSchema);
