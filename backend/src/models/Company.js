const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  logo: String,
  settings: {
    allowUserRegistration: {
      type: Boolean,
      default: false
    },
    defaultRole: {
      type: String,
      default: 'Team_Member'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date
}, {
  timestamps: true
});

companySchema.pre(/^find/, function(next) {
  this.find({ deletedAt: { $exists: false } });
  next();
});

module.exports = mongoose.model('Company', companySchema);
