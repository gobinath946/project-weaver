const mongoose = require('mongoose');

// Task Status Enum
const TASK_STATUS = [
  '1-Dev/Open',
  '1-Dev/Appd Task',
  '1-Dev/In Progrs',
  '1-Dev/Unit Tstg',
  '2-TSTG/Mvd to Tstg',
  '2-TSTG/Tstg In Progrs',
  '1-Dev/Bug Escltd',
  'On Hold',
  '2-Tstg/Rdy for UAT',
  '2-Tstg/Mvd to UAT',
  '2-Tstg/Rdy for Prod',
  'Closed',
  'Wtg for Lv Inpt',
  'Pdg Int. Resp',
  'Pdg Cust. Resp',
  'Recurring task',
  'Yet to St',
  'Ideation',
  '2-ATM/Feasibility',
  'Planned',
  'Creation',
  'To Review',
  'Resolved'
];

// Work Hours Entry Schema
const WorkHoursEntrySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business_hours: {
    type: String,
    default: 'Standard Business Hours'
  },
  total_hours: {
    type: Number,
    default: 0
  },
  duration: {
    type: String,
    default: '0d'
  },
  work_hours_per_day: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Estimation Split Schema
const EstimationSplitSchema = new mongoose.Schema({
  integration_estimate: { type: Number, default: 0 },
  web_dev_estimate: { type: Number, default: 0 },
  sfdc_estimate: { type: Number, default: 0 },
  bi_estimate: { type: Number, default: 0 },
  testing_estimate: { type: Number, default: 0 },
  infra_devops_estimate: { type: Number, default: 0 }
}, { _id: false });

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
    maxlength: [500, 'Name cannot exceed 500 characters']
  },
  description: {
    type: String,
    trim: true
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
  // Multiple owners who work on the task
  owners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Current owner - the main responsible person
  current_owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Legacy single assignee field for backward compatibility
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Legacy single owner field
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  associated_team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  status: {
    type: String,
    enum: TASK_STATUS,
    default: '1-Dev/Open'
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
  duration: {
    type: String,
    default: ''
  },
  // Total estimation
  total_estimation: {
    type: Number,
    default: 0
  },
  // Estimation split
  estimation_split: EstimationSplitSchema,
  // Work hours configuration
  work_hours: {
    type: String,
    default: '0:00'
  },
  work_hours_type: {
    type: String,
    enum: ['Standard', 'Flexible'],
    default: 'Standard'
  },
  work_hours_entries: [WorkHoursEntrySchema],
  // Legacy fields
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
  total_time_logged: {
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
  billing_type: {
    type: String,
    enum: ['None', 'Billable', 'Non-Billable'],
    default: 'None'
  },
  outcome: {
    type: String,
    trim: true
  },
  reminder: {
    type: String,
    enum: ['None', '1 Day Before', '2 Days Before', '1 Week Before'],
    default: 'None'
  },
  recurrence: {
    type: String,
    default: ''
  },
  // Parent task for subtasks
  parent_task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  is_subtask: {
    type: Boolean,
    default: false
  },
  subtask_count: {
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
TaskSchema.index({ project_id: 1 });
TaskSchema.index({ task_list_id: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ owner: 1 });
TaskSchema.index({ owners: 1 });
TaskSchema.index({ current_owner: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ company_id: 1 });
TaskSchema.index({ task_id: 1 });
TaskSchema.index({ due_date: 1 });
TaskSchema.index({ created_at: -1 });
TaskSchema.index({ parent_task_id: 1 });
TaskSchema.index({ billing_type: 1 });
TaskSchema.index({ tags: 1 });

// Update timestamp on save
TaskSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Auto-generate task_id based on project name
TaskSchema.pre('save', async function(next) {
  if (!this.task_id) {
    try {
      const Project = mongoose.model('Project');
      const project = await Project.findById(this.project_id);
      
      if (project) {
        // Generate prefix from project title (first letter of each word)
        const words = project.title.split(' ').filter(w => w.length > 0);
        const prefix = words.map(w => w.charAt(0).toUpperCase()).join('');
        
        // Count existing tasks for this project
        const count = await mongoose.model('Task').countDocuments({ project_id: this.project_id });
        this.task_id = `${prefix}-T${String(count + 1).padStart(3, '0')}`;
      } else {
        const count = await mongoose.model('Task').countDocuments({ company_id: this.company_id });
        this.task_id = `TSK-${String(count + 1).padStart(4, '0')}`;
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Calculate duration between start and due date
TaskSchema.pre('save', function(next) {
  if (this.start_date && this.due_date) {
    const diffTime = Math.abs(new Date(this.due_date) - new Date(this.start_date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.duration = `${diffDays} days`;
  }
  next();
});

// Update completion percentage based on status
TaskSchema.pre('save', function(next) {
  if (this.status === 'Closed' || this.status === 'Resolved') {
    this.completion_percentage = 100;
  } else if (this.status === '1-Dev/Open' || this.status === 'Yet to St') {
    this.completion_percentage = 0;
  }
  next();
});

// Static method to get tasks grouped by status for kanban
TaskSchema.statics.getKanbanData = async function(query) {
  const statuses = TASK_STATUS;
  const result = {};
  
  for (const status of statuses) {
    result[status] = await this.find({ ...query, status })
      .populate('assignee', 'first_name last_name email')
      .populate('current_owner', 'first_name last_name email')
      .populate('owners', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .populate('task_list_id', 'name')
      .sort({ updated_at: -1 })
      .limit(50);
  }
  
  return result;
};

// Static method to get tasks grouped by task list
TaskSchema.statics.getGroupedByTaskList = async function(query) {
  const TaskList = mongoose.model('TaskList');
  const taskLists = await TaskList.find({ 
    company_id: query.company_id,
    ...(query.project_id && { project_id: query.project_id })
  }).sort({ order: 1 });
  
  const result = {};
  
  // Get tasks without task list (General)
  result['General'] = await this.find({ ...query, task_list_id: null })
    .populate('assignee', 'first_name last_name email')
    .populate('current_owner', 'first_name last_name email')
    .populate('owners', 'first_name last_name email')
    .populate('project_id', 'title project_id')
    .sort({ created_at: -1 });
  
  // Get tasks for each task list
  for (const taskList of taskLists) {
    result[taskList.name] = await this.find({ ...query, task_list_id: taskList._id })
      .populate('assignee', 'first_name last_name email')
      .populate('current_owner', 'first_name last_name email')
      .populate('owners', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .sort({ created_at: -1 });
  }
  
  return result;
};

// Export status enum for use in other files
TaskSchema.statics.TASK_STATUS = TASK_STATUS;

module.exports = mongoose.model('Task', TaskSchema);
