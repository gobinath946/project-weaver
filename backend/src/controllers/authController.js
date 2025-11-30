const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');
const RefreshToken = require('../models/RefreshToken');
const logger = require('../config/logger');

const generateTokens = async (userId, req) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenDoc = await RefreshToken.create({
    userId,
    token: crypto.createHash('sha256').update(refreshToken).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip
  });

  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User already exists with this email' }
      });
    }

    // Create company if provided
    let company = null;
    if (companyName) {
      company = await Company.create({ name: companyName });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      companyId: company?._id,
      roles: company ? ['Super_Admin'] : ['Team_Member'],
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    if (company) {
      company.createdBy = user._id;
      await company.save();
    }

    const { accessToken, refreshToken } = await generateTokens(user._id, req);

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          companyId: user.companyId
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_INACTIVE', message: 'User account is inactive' }
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = await generateTokens(user._id, req);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          companyId: user.companyId,
          preferences: user.preferences
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token is required' }
      });
    }

    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenDoc = await RefreshToken.findOne({
      token: hashedToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' }
      });
    }

    // Revoke old token
    tokenDoc.isRevoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(tokenDoc.userId, req);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken }
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.json({
        success: true,
        message: 'If a user with that email exists, a password reset link has been sent'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // TODO: Send email with reset link
    logger.info(`Password reset requested for: ${user.email}`);

    res.json({
      success: true,
      message: 'If a user with that email exists, a password reset link has been sent',
      // In development, return the token
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token is invalid or has expired' }
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true, revokedAt: new Date() });

    logger.info(`Password reset for: ${user.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token is invalid or has expired' }
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Revoke all refresh tokens for this user
    await RefreshToken.updateMany(
      { userId: req.user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('companyId');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
