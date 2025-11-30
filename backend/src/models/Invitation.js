const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  acceptedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Invitation', invitationSchema);
