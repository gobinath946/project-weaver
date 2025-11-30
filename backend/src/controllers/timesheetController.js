const Timesheet = require('../models/Timesheet');
const TimeLog = require('../models/TimeLog');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

exports.getTimesheets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = {};

    // If not admin, only show own timesheets
    if (!req.user.roles.some(r => ['Super_Admin', 'Admin', 'Project_Manager'].includes(r))) {
      query.userId = req.user._id;
    }

    if (status) query.status = status;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };

    const timesheets = await Timesheet.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Timesheet.countDocuments(query);

    res.json({
      success: true,
      data: timesheets,
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

exports.getTimesheet = async (req, res, next) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: { code: 'TIMESHEET_NOT_FOUND', message: 'Timesheet not found' }
      });
    }

    // Get associated time logs
    const timeLogs = await TimeLog.find({ timesheetId: timesheet._id })
      .populate('projectId', 'name')
      .populate('taskId', 'name')
      .populate('bugId', 'title');

    res.json({
      success: true,
      data: {
        ...timesheet.toObject(),
        timeLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createTimesheet = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    // Check for existing timesheet in same period
    const existing = await Timesheet.findOne({
      userId: req.user._id,
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'TIMESHEET_EXISTS', message: 'A timesheet already exists for this period' }
      });
    }

    // Get time logs in this period
    const timeLogs = await TimeLog.find({
      userId: req.user._id,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      timesheetId: { $exists: false }
    });

    // Calculate totals
    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
    const billableHours = timeLogs
      .filter(log => log.billingType === 'Billable')
      .reduce((sum, log) => sum + log.hours, 0);
    const nonBillableHours = totalHours - billableHours;

    const timesheet = await Timesheet.create({
      userId: req.user._id,
      startDate,
      endDate,
      totalHours,
      billableHours,
      nonBillableHours
    });

    // Associate time logs with timesheet
    await TimeLog.updateMany(
      { _id: { $in: timeLogs.map(l => l._id) } },
      { timesheetId: timesheet._id }
    );

    res.status(201).json({
      success: true,
      data: timesheet
    });
  } catch (error) {
    next(error);
  }
};

exports.submitTimesheet = async (req, res, next) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: { code: 'TIMESHEET_NOT_FOUND', message: 'Timesheet not found' }
      });
    }

    // Check ownership
    if (timesheet.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    if (timesheet.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Only draft timesheets can be submitted' }
      });
    }

    // Recalculate totals
    const timeLogs = await TimeLog.find({ timesheetId: timesheet._id });
    timesheet.totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
    timesheet.billableHours = timeLogs
      .filter(log => log.billingType === 'Billable')
      .reduce((sum, log) => sum + log.hours, 0);
    timesheet.nonBillableHours = timesheet.totalHours - timesheet.billableHours;

    timesheet.status = 'Pending';
    timesheet.submittedAt = new Date();
    await timesheet.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Timesheet',
      resourceId: timesheet._id,
      changes: { after: { status: 'Pending' } },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: timesheet
    });
  } catch (error) {
    next(error);
  }
};

exports.approveTimesheet = async (req, res, next) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: { code: 'TIMESHEET_NOT_FOUND', message: 'Timesheet not found' }
      });
    }

    if (timesheet.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Only pending timesheets can be approved' }
      });
    }

    timesheet.status = 'Approved';
    timesheet.approvedBy = req.user._id;
    timesheet.approvedAt = new Date();
    await timesheet.save();

    // Notify user
    await Notification.create({
      userId: timesheet.userId,
      type: 'timesheet_status',
      title: 'Timesheet Approved',
      message: 'Your timesheet has been approved',
      resourceType: 'timesheet',
      resourceId: timesheet._id
    });

    const io = req.app.get('io');
    io.to(`user:${timesheet.userId}`).emit('notification:new', {
      type: 'timesheet_status',
      message: 'Your timesheet has been approved'
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Timesheet',
      resourceId: timesheet._id,
      changes: { after: { status: 'Approved', approvedBy: req.user._id } },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: timesheet
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectTimesheet = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: { code: 'TIMESHEET_NOT_FOUND', message: 'Timesheet not found' }
      });
    }

    if (timesheet.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Only pending timesheets can be rejected' }
      });
    }

    timesheet.status = 'Rejected';
    timesheet.rejectionReason = reason;
    await timesheet.save();

    // Notify user
    await Notification.create({
      userId: timesheet.userId,
      type: 'timesheet_status',
      title: 'Timesheet Rejected',
      message: `Your timesheet was rejected: ${reason}`,
      resourceType: 'timesheet',
      resourceId: timesheet._id
    });

    const io = req.app.get('io');
    io.to(`user:${timesheet.userId}`).emit('notification:new', {
      type: 'timesheet_status',
      message: `Your timesheet was rejected: ${reason}`
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Timesheet',
      resourceId: timesheet._id,
      changes: { after: { status: 'Rejected', rejectionReason: reason } },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: timesheet
    });
  } catch (error) {
    next(error);
  }
};
