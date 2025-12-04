const mongoose = require('mongoose');

const TaskListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Task list name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  related_milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    default: null
  },
  task_list_flag: {
    type: String,
    enum: ['Internal', 'External', 'None'],
    default: 'Internal'
  },
  tags: [{
    type: String,
    trim: true
  }],
  order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  task_count: {
    type: Number,
    default: 0
  },
  completed_task_count: {
    type: Number,
    default: 0
  },
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
TaskListSchema.index({ project_id: 1 });
TaskListSchema.index({ company_id: 1 });
TaskListSchema.index({ order: 1 });
TaskListSchema.index({ is_active: 1 });
TaskListSchema.index({ tags: 1 });

// Update timestamp on save
TaskListSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Update task counts
TaskListSchema.methods.updateTaskCounts = async function() {
  const Task = mongoose.model('Task');
  const totalTasks = await Task.countDocuments({ task_list_id: this._id });
  const completedTasks = await Task.countDocuments({ 
    task_list_id: this._id, 
    status: { $in: ['Closed', 'Resolved'] }
  });
  
  this.task_count = totalTasks;
  this.completed_task_count = completedTasks;
  await this.save();
};

module.exports = mongoose.model('TaskList', TaskListSchema);
