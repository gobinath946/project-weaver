const mongoose = require('mongoose');

const taskListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Task list name is required'],
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TaskList', taskListSchema);
