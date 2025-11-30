const TimeLog = require('../models/TimeLog');
const Timesheet = require('../models/Timesheet');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const AuditLog = require('../models/AuditLog');

exports.getTimeLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      projectId, 
      taskId,
      bugId,
      startDate,
      endDate,
      billingType
    } = req.query;

    const query = { userId: req.user._id };

    if (projectId) query.projectId = projectId;
    if (taskId) query.taskId = taskId;
    if (bugId) query.bugId = bugId;
    if (billingType) query.billingType = billingType;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const timeLogs = await TimeLog.find(query)
      .populate('projectId', 'name')
      .populate('taskId', 'name')
      .populate('bugId', 'title')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await TimeLog.countDocuments(query);

    res.json({
      success: true,
      data: timeLogs,
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

exports.getTimeLog = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('taskId', 'name')
      .populate('bugId', 'title');

    if (!timeLog) {
      return res.status(404).json({
        success: false,
        error: { code: 'TIMELOG_NOT_FOUND', message: 'Time log not found' }
      });
    }

    // Check ownership
    if (timeLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    res.json({
      success: true,
      data: timeLog
    });
  } catch (error) {
    next(error);
  }
};

exports.createTimeLog = async (req, res, next) => {
  try {
    const { projectId, taskId, bugId, date, hours, timePeriod, billingType, notes } = req.body;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      });
    }

    // Check if user has access to project
    const hasAccess = project.teamMembers.some(
      m => m.userId.toString() === req.user._id.toString()
    ) || req.user.roles.some(r => ['Super_Admin', 'Admin'].includes(r));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'You do not have access to this project' }
      });
    }

    // If task provided, verify assignment
    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task || task.projectId.toString() !== projectId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TASK', message: 'Invalid task for this project' }
        });
      }
      const isAssigned = task.assignees.some(a => a.toString() === req.user._id.toString());
      if (!isAssigned && !req.user.roles.some(r => ['Super_Admin', 'Admin', 'Project_Manager'].includes(r))) {
        return res.status(403).json({
          success: false,
          error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this task' }
        });
      }
    }

    // If bug provided, verify assignment
    if (bugId) {
      const bug = await Bug.findById(bugId);
      if (!bug || bug.projectId.toString() !== projectId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_BUG', message: 'Invalid bug for this project' }
        });
      }
      if (bug.assignee?.toString() !== req.user._id.toString() && 
          !req.user.roles.some(r => ['Super_Admin', 'Admin', 'Project_Manager'].includes(r))) {
        return res.status(403).json({
          success: false,
          error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this bug' }
        });
      }
    }

    const timeLog = await TimeLog.create({
      userId: req.user._id,
      projectId,
      taskId,
      bugId,
      date,
      hours,
      timePeriod,
      billingType,
      notes
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      resourceType: 'TimeLog',
      resourceId: timeLog._id,
      changes: { after: timeLog.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: timeLog
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTimeLog = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id);

    if (!timeLog) {
      return res.status(404).json({
        success: false,
        error: { code: 'TIMELOG_NOT_FOUND', message: 'Time log not found' }
      });
    }

    // Check ownership
    if (timeLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    const before = timeLog.toObject();
    const { date, hours, timePeriod, billingType, notes } = req.body;

    if (date) timeLog.date = date;
    if (hours !== undefined) timeLog.hours = hours;
    if (timePeriod) timeLog.timePeriod = timePeriod;
    if (billingType) timeLog.billingType = billingType;
    if (notes !== undefined) timeLog.notes = notes;

    await timeLog.save();

    // Reset timesheet to draft if associated
    if (timeLog.timesheetId) {
      await Timesheet.findByIdAndUpdate(timeLog.timesheetId, { status: 'Draft' });
    }

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'TimeLog',
      resourceId: timeLog._id,
      changes: { before, after: timeLog.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: timeLog
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTimeLog = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id);

    if (!timeLog) {
      return res.status(404).json({
        success: false,
        error: { code: 'TIMELOG_NOT_FOUND', message: 'Time log not found' }
      });
    }

    // Check ownership
    if (timeLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    // Reset timesheet to draft if associated
    if (timeLog.timesheetId) {
      await Timesheet.findByIdAndUpdate(timeLog.timesheetId, { status: 'Draft' });
    }

    await timeLog.deleteOne();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      resourceType: 'TimeLog',
      resourceId: timeLog._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Time log deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
