const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
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
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  replacedByToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RefreshToken'
  },
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
