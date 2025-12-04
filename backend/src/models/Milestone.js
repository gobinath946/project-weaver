const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Milestone name is required'],
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
  due_date: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
    default: 'Not Started'
  },
  is_active: {
    type: Boolean,
    default: true
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

MilestoneSchema.index({ project_id: 1 });
MilestoneSchema.index({ company_id: 1 });
MilestoneSchema.index({ status: 1 });

MilestoneSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Milestone', MilestoneSchema);
