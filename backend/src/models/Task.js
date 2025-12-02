const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  task_id: {
    type: String,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
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
  task_list_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskList',
    default: null
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Not Started'
  },
  priority: {
    type: String,
    enum: ['None', 'Low', 'Medium', 'High', 'Urgent'],
    default: 'None'
  },
  start_date: {
    type: Date
  },
  due_date: {
    type: Date
  },
  work_hours_estimate: {
    type: Number,
    default: 0,
    min: 0
  },
  actual_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  completion_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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
TaskSchema.index({ project_id: 1 });
TaskSchema.index({ task_list_id: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ owner: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ company_id: 1 });
TaskSchema.index({ task_id: 1 });
TaskSchema.index({ due_date: 1 });
TaskSchema.index({ created_at: -1 });

// Update timestamp on save
TaskSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Auto-generate task_id before saving
TaskSchema.pre('save', async function(next) {
  if (!this.task_id) {
    try {
      const count = await mongoose.model('Task').countDocuments({ company_id: this.company_id });
      this.task_id = `TSK-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Update completion percentage based on status
TaskSchema.pre('save', function(next) {
  if (this.status === 'Completed') {
    this.completion_percentage = 100;
  } else if (this.status === 'Not Started') {
    this.completion_percentage = 0;
  }
  next();
});

// Static method to get tasks grouped by status for kanban
TaskSchema.statics.getKanbanData = async function(query) {
  const statuses = ['Not Started', 'In Progress', 'On Hold', 'Completed'];
  const result = {};
  
  for (const status of statuses) {
    result[status] = await this.find({ ...query, status })
      .populate('assignee', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .sort({ updated_at: -1 });
  }
  
  return result;
};

module.exports = mongoose.model('Task', TaskSchema);
