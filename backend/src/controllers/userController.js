const crypto = require('crypto');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    
    const query = { companyId: req.user.companyId };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.roles = role;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('companyId')
      .populate('organizationIds');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Check same company
    if (user.companyId?.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, avatar, timezone } = req.body;
    
    // Can only update own profile unless admin
    if (req.params.id !== req.user._id.toString() && 
        !req.user.roles.some(r => ['Super_Admin', 'Admin'].includes(r))) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot update other users' }
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const before = user.toObject();

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (avatar) user.avatar = avatar;
    if (timezone) user.timezone = timezone;

    await user.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'User',
      resourceId: user._id,
      changes: { before, after: user.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { theme, emailNotifications, digestFrequency } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    if (theme) user.preferences.theme = theme;
    if (typeof emailNotifications === 'boolean') user.preferences.emailNotifications = emailNotifications;
    if (digestFrequency) user.preferences.digestFrequency = digestFrequency;

    await user.save();

    res.json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    next(error);
  }
};

exports.inviteUser = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User already exists with this email' }
      });
    }

    // Check if invitation already exists
    const existingInvite = await Invitation.findOne({
      email,
      companyId: req.user.companyId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvite) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVITE_EXISTS', message: 'An active invitation already exists for this email' }
      });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const invitation = await Invitation.create({
      email,
      companyId: req.user.companyId,
      role,
      invitedBy: req.user._id,
      token: crypto.createHash('sha256').update(token).digest('hex')
    });

    // TODO: Send invitation email
    logger.info(`User invited: ${email} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: {
        invitation,
        // In development, return the token
        ...(process.env.NODE_ENV === 'development' && { inviteToken: token })
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Can't delete self
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_DELETE_SELF', message: 'Cannot delete your own account' }
      });
    }

    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      resourceType: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
