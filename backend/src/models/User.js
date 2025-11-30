const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  avatar: String,
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  organizationIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  }],
  roles: [{
    type: String,
    enum: ['Super_Admin', 'Admin', 'Project_Manager', 'Team_Lead', 'Team_Member', 'Client'],
    default: 'Team_Member'
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    digestFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'never'],
      default: 'daily'
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  deletedAt: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Exclude deleted users by default
userSchema.pre(/^find/, function(next) {
  this.find({ deletedAt: { $exists: false } });
  next();
});

module.exports = mongoose.model('User', userSchema);
