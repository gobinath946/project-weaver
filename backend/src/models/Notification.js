const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task_assigned', 'bug_assigned', 'comment_mention', 'timesheet_status', 'deadline_reminder', 'project_update'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['task', 'bug', 'timesheet', 'project', 'comment']
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
