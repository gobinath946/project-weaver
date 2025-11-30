const Project = require('../models/Project');
const Organization = require('../models/Organization');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, organizationId, search } = req.query;

    const query = { companyId: req.user.companyId };

    if (status) query.status = status;
    if (organizationId) query.organizationId = organizationId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // If not admin, only show projects user is a member of
    if (!req.user.roles.some(r => ['Super_Admin', 'Admin'].includes(r))) {
      query['teamMembers.userId'] = req.user._id;
    }

    const projects = await Project.find(query)
      .populate('organizationId', 'name')
      .populate('teamMembers.userId', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: projects,
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

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('organizationId', 'name')
      .populate('teamMembers.userId', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      });
    }

    // Check access
    if (project.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { name, description, organizationId, startDate, endDate, budget, status } = req.body;

    // Verify organization belongs to user's company
    const organization = await Organization.findById(organizationId);
    if (!organization || organization.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this organization' }
      });
    }

    // Validate dates
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATES', message: 'End date must be after start date' }
      });
    }

    const project = await Project.create({
      name,
      description,
      organizationId,
      companyId: req.user.companyId,
      startDate,
      endDate,
      budget,
      status: status || 'active',
      teamMembers: [{ userId: req.user._id, role: 'Project_Manager' }],
      createdBy: req.user._id
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      resourceType: 'Project',
      resourceId: project._id,
      changes: { after: project.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      });
    }

    // Check access
    if (project.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    const before = project.toObject();
    const { name, description, startDate, endDate, budget, status, customStatuses } = req.body;

    // Validate dates
    const newStartDate = startDate || project.startDate;
    const newEndDate = endDate || project.endDate;
    if (newStartDate && newEndDate && new Date(newEndDate) < new Date(newStartDate)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATES', message: 'End date must be after start date' }
      });
    }

    // Validate budget
    if (budget !== undefined && budget < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_BUDGET', message: 'Budget must be non-negative' }
      });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (budget !== undefined) project.budget = budget;
    if (status) project.status = status;
    if (customStatuses) project.customStatuses = customStatuses;

    await project.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project:${project._id}`).emit('project:updated', project);

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Project',
      resourceId: project._id,
      changes: { before, after: project.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      });
    }

    // Soft delete
    project.deletedAt = new Date();
    await project.save();

    // Soft delete all tasks
    await Task.updateMany(
      { projectId: project._id },
      { deletedAt: new Date() }
    );

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      resourceType: 'Project',
      resourceId: project._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.addTeamMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      });
    }

    // Check if already a member
    if (project.teamMembers.some(m => m.userId.toString() === userId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_MEMBER', message: 'User is already a team member' }
      });
    }

    project.teamMembers.push({ userId, role: role || 'Team_Member' });
    await project.save();

    // Create notification
    await Notification.create({
      userId,
      type: 'project_update',
      title: 'Added to Project',
      message: `You have been added to project "${project.name}"`,
      resourceType: 'project',
      resourceId: project._id
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user:${userId}`).emit('notification:new', {
      type: 'project_update',
      message: `You have been added to project "${project.name}"`
    });

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

exports.removeTeamMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      });
    }

    project.teamMembers = project.teamMembers.filter(
      m => m.userId.toString() !== req.params.userId
    );
    await project.save();

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

exports.createMilestone = async (req, res, next) => {
  try {
    const { name, description, dueDate } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      });
    }

    // Validate milestone date within project dates
    if (project.startDate && new Date(dueDate) < new Date(project.startDate)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE', message: 'Milestone date must be after project start date' }
      });
    }

    if (project.endDate && new Date(dueDate) > new Date(project.endDate)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE', message: 'Milestone date must be before project end date' }
      });
    }

    const milestone = await Milestone.create({
      name,
      description,
      projectId: project._id,
      dueDate,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    next(error);
  }
};

exports.getMilestones = async (req, res, next) => {
  try {
    const milestones = await Milestone.find({ projectId: req.params.id })
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    next(error);
  }
};
