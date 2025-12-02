const TimeLog = require('../models/TimeLog');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// Helper function to build role-based query
const buildRoleBasedQuery = (user, baseQuery = {}) => {
  const query = { ...baseQuery, company_id: user.company_id };
  
  if (user.role === 'company_super_admin') {
    return query;
  }
  
  query.user_id = user.id;
  return query;
};

// @desc    Get all time logs with pagination
// @route   GET /api/timelogs
// @access  Private
const getTimeLogs = async (req, res) => {
  try {
    const { 
      page = 1, limit = 20, project_id, user_id, approval_status,
      billing_type, start_date, end_date, sort = '-date' 
    } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    
    if (project_id) query.project_id = project_id;
    if (user_id && req.user.role === 'company_super_admin') query.user_id = user_id;
    if (approval_status) query.approval_status = approval_status;
    if (billing_type) query.billing_type = billing_type;
    
    // Date range filter
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [timeLogs, total, aggregates] = await Promise.all([
      TimeLog.find(query)
        .populate('user_id', 'first_name last_name email')
        .populate('project_id', 'title project_id')
        .populate('task_id', 'name task_id')
        .populate('bug_id', 'title bug_id')
        .populate('approved_by', 'first_name last_name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      TimeLog.countDocuments(query),
      TimeLog.getAggregatedHours(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: timeLogs,
      aggregates,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_count: total,
        has_more: skip + timeLogs.length < total
      }
    });
  } catch (error) {
    console.error('Get time logs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching time logs' });
  }
};

// @desc    Get single time log
// @route   GET /api/timelogs/:id
// @access  Private
const getTimeLog = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    
    const timeLog = await TimeLog.findOne(query)
      .populate('user_id', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .populate('task_id', 'name task_id')
      .populate('bug_id', 'title bug_id')
      .populate('approved_by', 'first_name last_name email');
    
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Time log not found' });
    }
    
    res.status(200).json({ success: true, data: timeLog });
  } catch (error) {
    console.error('Get time log error:', error);
    res.status(500).json({ success: false, message: 'Error fetching time log' });
  }
};

// @desc    Create time log
// @route   POST /api/timelogs
// @access  Private
const createTimeLog = async (req, res) => {
  try {
    const {
      title, project_id, task_id, bug_id, date, daily_log_hours,
      start_time, end_time, billing_type, notes
    } = req.body;
    
    if (!project_id || !date || daily_log_hours === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Project, date, and hours are required'
      });
    }
    
    // Verify project exists
    const project = await Project.findOne({
      _id: project_id,
      company_id: req.user.company_id
    });
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const timeLog = new TimeLog({
      title, project_id, task_id, bug_id,
      company_id: req.user.company_id,
      user_id: req.user.id,
      date: new Date(date),
      daily_log_hours,
      start_time, end_time,
      billing_type: billing_type || 'Billable',
      notes,
      created_by: req.user.id
    });
    
    await timeLog.save();
    
    await timeLog.populate('user_id', 'first_name last_name email');
    await timeLog.populate('project_id', 'title project_id');
    if (task_id) await timeLog.populate('task_id', 'name task_id');
    if (bug_id) await timeLog.populate('bug_id', 'title bug_id');
    
    res.status(201).json({
      success: true,
      message: 'Time log created successfully',
      data: timeLog
    });
  } catch (error) {
    console.error('Create time log error:', error);
    res.status(500).json({ success: false, message: 'Error creating time log' });
  }
};

// @desc    Update time log
// @route   PUT /api/timelogs/:id
// @access  Private
const updateTimeLog = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    const timeLog = await TimeLog.findOne(query);
    
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Time log not found' });
    }
    
    // Cannot update approved time logs (unless super admin)
    if (timeLog.approval_status === 'Approved' && req.user.role !== 'company_super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify approved time log'
      });
    }
    
    const allowedUpdates = [
      'title', 'task_id', 'bug_id', 'date', 'daily_log_hours',
      'start_time', 'end_time', 'billing_type', 'notes'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        timeLog[field] = field === 'date' ? new Date(req.body[field]) : req.body[field];
      }
    });
    
    // Reset approval if modified
    if (timeLog.approval_status === 'Approved') {
      timeLog.approval_status = 'Pending';
      timeLog.approved_by = null;
      timeLog.approved_at = null;
    }
    
    await timeLog.save();
    
    await timeLog.populate('user_id', 'first_name last_name email');
    await timeLog.populate('project_id', 'title project_id');
    
    res.status(200).json({
      success: true,
      message: 'Time log updated successfully',
      data: timeLog
    });
  } catch (error) {
    console.error('Update time log error:', error);
    res.status(500).json({ success: false, message: 'Error updating time log' });
  }
};

// @desc    Delete time log
// @route   DELETE /api/timelogs/:id
// @access  Private
const deleteTimeLog = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    const timeLog = await TimeLog.findOne(query);
    
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Time log not found' });
    }
    
    // Cannot delete approved time logs (unless super admin)
    if (timeLog.approval_status === 'Approved' && req.user.role !== 'company_super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved time log'
      });
    }
    
    await TimeLog.deleteOne({ _id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Time log deleted successfully'
    });
  } catch (error) {
    console.error('Delete time log error:', error);
    res.status(500).json({ success: false, message: 'Error deleting time log' });
  }
};

// @desc    Approve time log
// @route   PATCH /api/timelogs/:id/approve
// @access  Private (company_super_admin only)
const approveTimeLog = async (req, res) => {
  try {
    if (req.user.role !== 'company_super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can approve time logs'
      });
    }
    
    const timeLog = await TimeLog.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });
    
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Time log not found' });
    }
    
    timeLog.approval_status = 'Approved';
    timeLog.approved_by = req.user.id;
    timeLog.approved_at = new Date();
    
    await timeLog.save();
    
    await timeLog.populate('user_id', 'first_name last_name email');
    await timeLog.populate('approved_by', 'first_name last_name email');
    
    res.status(200).json({
      success: true,
      message: 'Time log approved successfully',
      data: timeLog
    });
  } catch (error) {
    console.error('Approve time log error:', error);
    res.status(500).json({ success: false, message: 'Error approving time log' });
  }
};

// @desc    Reject time log
// @route   PATCH /api/timelogs/:id/reject
// @access  Private (company_super_admin only)
const rejectTimeLog = async (req, res) => {
  try {
    if (req.user.role !== 'company_super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can reject time logs'
      });
    }
    
    const { reason } = req.body;
    
    const timeLog = await TimeLog.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });
    
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Time log not found' });
    }
    
    timeLog.approval_status = 'Rejected';
    timeLog.approved_by = req.user.id;
    timeLog.approved_at = new Date();
    timeLog.rejection_reason = reason;
    
    await timeLog.save();
    
    await timeLog.populate('user_id', 'first_name last_name email');
    
    res.status(200).json({
      success: true,
      message: 'Time log rejected',
      data: timeLog
    });
  } catch (error) {
    console.error('Reject time log error:', error);
    res.status(500).json({ success: false, message: 'Error rejecting time log' });
  }
};

// @desc    Get aggregated hours
// @route   GET /api/timelogs/aggregates
// @access  Private
const getTimeLogAggregates = async (req, res) => {
  try {
    const { project_id, user_id, start_date, end_date } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    
    if (project_id) query.project_id = new mongoose.Types.ObjectId(project_id);
    if (user_id && req.user.role === 'company_super_admin') {
      query.user_id = new mongoose.Types.ObjectId(user_id);
    }
    
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    
    const aggregates = await TimeLog.getAggregatedHours(query);
    const groupedByDate = await TimeLog.getGroupedByDate(query);
    
    res.status(200).json({
      success: true,
      data: {
        summary: aggregates,
        by_date: groupedByDate
      }
    });
  } catch (error) {
    console.error('Get time log aggregates error:', error);
    res.status(500).json({ success: false, message: 'Error fetching aggregates' });
  }
};

module.exports = {
  getTimeLogs,
  getTimeLog,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog,
  approveTimeLog,
  rejectTimeLog,
  getTimeLogAggregates
};
