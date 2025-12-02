const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
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
  bug_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bug',
    default: null
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  daily_log_hours: {
    type: Number,
    required: [true, 'Daily log hours is required'],
    min: [0, 'Hours cannot be negative'],
    max: [24, 'Hours cannot exceed 24']
  },
  start_time: {
    type: String,
    trim: true
  },
  end_time: {
    type: String,
    trim: true
  },
  billing_type: {
    type: String,
    enum: ['Billable', 'Non-Billable'],
    default: 'Billable'
  },
  approval_status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approved_at: {
    type: Date,
    default: null
  },
  rejection_reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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
TimeLogSchema.index({ project_id: 1 });
TimeLogSchema.index({ task_id: 1 });
TimeLogSchema.index({ bug_id: 1 });
TimeLogSchema.index({ user_id: 1 });
TimeLogSchema.index({ date: 1 });
TimeLogSchema.index({ approval_status: 1 });
TimeLogSchema.index({ billing_type: 1 });
TimeLogSchema.index({ company_id: 1 });
TimeLogSchema.index({ log_id: 1 });
TimeLogSchema.index({ created_at: -1 });

// Compound index for date range queries
TimeLogSchema.index({ company_id: 1, date: 1 });
TimeLogSchema.index({ user_id: 1, date: 1 });

// Update timestamp on save
TimeLogSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Auto-generate log_id before saving
TimeLogSchema.pre('save', async function(next) {
  if (!this.log_id) {
    try {
      const count = await mongoose.model('TimeLog').countDocuments({ company_id: this.company_id });
      this.log_id = `TL-${String(count + 1).padStart(5, '0')}`;
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Static method to get aggregated hours
TimeLogSchema.statics.getAggregatedHours = async function(query) {
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$billing_type',
        total_hours: { $sum: '$daily_log_hours' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const aggregated = {
    billable_hours: 0,
    non_billable_hours: 0,
    total_hours: 0,
    billable_count: 0,
    non_billable_count: 0
  };
  
  result.forEach(item => {
    if (item._id === 'Billable') {
      aggregated.billable_hours = item.total_hours;
      aggregated.billable_count = item.count;
    } else {
      aggregated.non_billable_hours = item.total_hours;
      aggregated.non_billable_count = item.count;
    }
  });
  
  aggregated.total_hours = aggregated.billable_hours + aggregated.non_billable_hours;
  
  return aggregated;
};

// Static method to get time logs grouped by date
TimeLogSchema.statics.getGroupedByDate = async function(query) {
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        logs: { $push: '$$ROOT' },
        total_hours: { $sum: '$daily_log_hours' },
        billable_hours: {
          $sum: {
            $cond: [{ $eq: ['$billing_type', 'Billable'] }, '$daily_log_hours', 0]
          }
        },
        non_billable_hours: {
          $sum: {
            $cond: [{ $eq: ['$billing_type', 'Non-Billable'] }, '$daily_log_hours', 0]
          }
        }
      }
    },
    { $sort: { _id: -1 } }
  ]);
};

module.exports = mongoose.model('TimeLog', TimeLogSchema);
