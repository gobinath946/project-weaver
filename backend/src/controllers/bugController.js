const Bug = require('../models/Bug');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

exports.getBugs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      projectId, 
      status, 
      severity,
      priority,
      assignee,
      reporter,
      module,
      classification,
      dueDate,
      search 
    } = req.query;

    const query = {};

    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (reporter) query.reporter = reporter;
    if (module) query.module = module;
    if (classification) query.classification = classification;
    if (dueDate) query.dueDate = { $lte: new Date(dueDate) };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const bugs = await Bug.find(query)
      .populate('projectId', 'name')
      .populate('assignee', 'firstName lastName email avatar')
      .populate('reporter', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Bug.countDocuments(query);

    res.json({
      success: true,
      data: bugs,
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

exports.getBug = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('projectId', 'name companyId')
      .populate('assignee', 'firstName lastName email avatar')
      .populate('associatedTeam', 'firstName lastName email avatar')
      .populate('reporter', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUG_NOT_FOUND', message: 'Bug not found' }
      });
    }

    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

exports.createBug = async (req, res, next) => {
  try {
    const { 
      title, description, projectId, assignee,
      status, severity, priority, dueDate,
      module, classification, flag, reproducibility, tags
    } = req.body;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project || project.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this project' }
      });
    }

    const bug = await Bug.create({
      title,
      description,
      projectId,
      assignee,
      reporter: req.user._id,
      status: status || 'Open',
      severity: severity || 'Medium',
      priority: priority || 'Medium',
      dueDate,
      module,
      classification,
      flag,
      reproducibility,
      tags,
      createdBy: req.user._id
    });

    // Notify assignee
    if (assignee) {
      await Notification.create({
        userId: assignee,
        type: 'bug_assigned',
        title: 'Bug Assigned',
        message: `You have been assigned to bug "${bug.title}"`,
        resourceType: 'bug',
        resourceId: bug._id
      });

      const io = req.app.get('io');
      io.to(`user:${assignee}`).emit('notification:new', {
        type: 'bug_assigned',
        message: `You have been assigned to bug "${bug.title}"`
      });
    }

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      resourceType: 'Bug',
      resourceId: bug._id,
      changes: { after: bug.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBug = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUG_NOT_FOUND', message: 'Bug not found' }
      });
    }

    const before = bug.toObject();
    const updates = req.body;

    // Validate completion percentage
    if (updates.completionPercentage !== undefined) {
      if (updates.completionPercentage < 0 || updates.completionPercentage > 100) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PERCENTAGE', message: 'Completion percentage must be between 0 and 100' }
        });
      }
    }

    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'projectId') {
        bug[key] = updates[key];
      }
    });

    await bug.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project:${bug.projectId}`).emit('bug:updated', bug);

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Bug',
      resourceId: bug._id,
      changes: { before, after: bug.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBug = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUG_NOT_FOUND', message: 'Bug not found' }
      });
    }

    bug.deletedAt = new Date();
    await bug.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      resourceType: 'Bug',
      resourceId: bug._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.assignBug = async (req, res, next) => {
  try {
    const { assignee } = req.body;
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUG_NOT_FOUND', message: 'Bug not found' }
      });
    }

    const previousAssignee = bug.assignee;
    bug.assignee = assignee;
    await bug.save();

    // Notify new assignee
    if (assignee && assignee !== previousAssignee?.toString()) {
      await Notification.create({
        userId: assignee,
        type: 'bug_assigned',
        title: 'Bug Assigned',
        message: `You have been assigned to bug "${bug.title}"`,
        resourceType: 'bug',
        resourceId: bug._id
      });

      const io = req.app.get('io');
      io.to(`user:${assignee}`).emit('notification:new', {
        type: 'bug_assigned',
        message: `You have been assigned to bug "${bug.title}"`
      });
    }

    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUG_NOT_FOUND', message: 'Bug not found' }
      });
    }

    const before = bug.toObject();
    bug.status = status;

    if (status === 'Closed' || status === 'Resolved') {
      bug.completionPercentage = 100;
    }

    await bug.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project:${bug.projectId}`).emit('bug:status_changed', {
      bugId: bug._id,
      status: bug.status,
      previousStatus: before.status
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Bug',
      resourceId: bug._id,
      changes: { before, after: bug.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { content, mentions } = req.body;

    const comment = await Comment.create({
      content,
      bugId: req.params.id,
      userId: req.user._id,
      mentions
    });

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      const bug = await Bug.findById(req.params.id);
      const notifications = mentions.map(userId => ({
        userId,
        type: 'comment_mention',
        title: 'Mentioned in Comment',
        message: `You were mentioned in a comment on bug "${bug.title}"`,
        resourceType: 'bug',
        resourceId: bug._id
      }));
      await Notification.insertMany(notifications);
    }

    await comment.populate('userId', 'firstName lastName email avatar');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ bugId: req.params.id })
      .populate('userId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};
