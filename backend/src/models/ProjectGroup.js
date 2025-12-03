const mongoose = require('mongoose');

const ProjectGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project group name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  project_count: {
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

// Indexes
ProjectGroupSchema.index({ company_id: 1 });
ProjectGroupSchema.index({ name: 1, company_id: 1 }, { unique: true });

// Update timestamp on save
ProjectGroupSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Update project count
ProjectGroupSchema.methods.updateProjectCount = async function() {
  const Project = mongoose.model('Project');
  const count = await Project.countDocuments({ project_group: this._id });
  this.project_count = count;
  await this.save();
};

module.exports = mongoose.model('ProjectGroup', ProjectGroupSchema);
