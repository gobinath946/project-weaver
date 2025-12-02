const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Project = require('../models/Project');
const TimeLog = require('../models/TimeLog');

// Helper function to build role-based query
const buildRoleBasedQuery = (user, baseQuery = {}) => {
  const query = { ...baseQuery, company_id: user.company_id };
  
  if (user.role === 'company_super_admin') {
    return query;
  }
  
  return query;
};

// @desc    Get dashboard statistics
// @route   GET /api/project-dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const baseQuery = { company_id: req.user.company_id };
    const userQuery = req.user.role === 'company_super_admin' 
      ? baseQuery 
      : { ...baseQuery, $or: [{ assignee: req.user.id }, { owner: req.user.id }] };
    
    const bugUserQuery = req.user.role === 'company_super_admin'
      ? baseQuery
      : { ...baseQuery, $or: [{ assignee: req.user.id }, { reporter: req.user.id }] };
    
    const [
      openTasks,
      closedTasks,
      openBugs,
      closedBugs,
      totalProjects,
      activeProjects
    ] = await Promise.all([
      Task.countDocuments({ ...userQuery, status: { $ne: 'Completed' } }),
      Task.countDocuments({ ...userQuery, status: 'Completed' }),
      Bug.countDocuments({ ...bugUserQuery, status: { $ne: 'Closed' } }),
      Bug.countDocuments({ ...bugUserQuery, status: 'Closed' }),
      Project.countDocuments(baseQuery),
      Project.countDocuments({ ...baseQuery, status: 'Active' })
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        open_tasks: openTasks,
        closed_tasks: closedTasks,
        open_bugs: openBugs,
        closed_bugs: closedBugs,
        total_projects: totalProjects,
        active_projects: activeProjects
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
};

// @desc    Get user's tasks
// @route   GET /api/project-dashboard/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const query = {
      company_id: req.user.company_id,
      status: { $ne: 'Completed' }
    };
    
    if (req.user.role !== 'company_super_admin') {
      query.$or = [{ assignee: req.user.id }, { owner: req.user.id }];
    }
    
    const tasks = await Task.find(query)
      .populate('project_id', 'title project_id')
      .populate('assignee', 'first_name last_name')
      .sort({ due_date: 1, priority: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

// @desc    Get items due today
// @route   GET /api/project-dashboard/due-today
// @access  Private
const getDueToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const baseQuery = {
      company_id: req.user.company_id,
      due_date: { $gte: today, $lt: tomorrow },
      status: { $ne: 'Completed' }
    };
    
    const taskQuery = req.user.role === 'company_super_admin'
      ? baseQuery
      : { ...baseQuery, $or: [{ assignee: req.user.id }, { owner: req.user.id }] };
    
    const bugQuery = req.user.role === 'company_super_admin'
      ? { ...baseQuery, status: { $ne: 'Closed' } }
      : { ...baseQuery, status: { $ne: 'Closed' }, $or: [{ assignee: req.user.id }, { reporter: req.user.id }] };
    
    const [tasks, bugs] = await Promise.all([
      Task.find(taskQuery)
        .populate('project_id', 'title project_id')
        .populate('assignee', 'first_name last_name')
        .sort({ priority: -1 }),
      Bug.find(bugQuery)
        .populate('project_id', 'title project_id')
        .populate('assignee', 'first_name last_name')
        .sort({ severity: -1 })
    ]);
    
    res.status(200).json({
      success: true,
      data: { tasks, bugs }
    });
  } catch (error) {
    console.error('Get due today error:', error);
    res.status(500).json({ success: false, message: 'Error fetching due items' });
  }
};

// @desc    Get overdue items
// @route   GET /api/project-dashboard/overdue
// @access  Private
const getOverdueItems = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const baseQuery = {
      company_id: req.user.company_id,
      due_date: { $lt: today },
      status: { $nin: ['Completed', 'Cancelled'] }
    };
    
    const taskQuery = req.user.role === 'company_super_admin'
      ? baseQuery
      : { ...baseQuery, $or: [{ assignee: req.user.id }, { owner: req.user.id }] };
    
    const bugQuery = req.user.role === 'company_super_admin'
      ? { ...baseQuery, status: { $nin: ['Closed'] } }
      : { ...baseQuery, status: { $nin: ['Closed'] }, $or: [{ assignee: req.user.id }, { reporter: req.user.id }] };
    
    const [tasks, bugs] = await Promise.all([
      Task.find(taskQuery)
        .populate('project_id', 'title project_id')
        .populate('assignee', 'first_name last_name')
        .sort({ due_date: 1 }),
      Bug.find(bugQuery)
        .populate('project_id', 'title project_id')
        .populate('assignee', 'first_name last_name')
        .sort({ due_date: 1 })
    ]);
    
    // Calculate days overdue
    const tasksWithOverdue = tasks.map(task => ({
      ...task.toObject(),
      days_overdue: Math.floor((today - new Date(task.due_date)) / (1000 * 60 * 60 * 24))
    }));
    
    const bugsWithOverdue = bugs.map(bug => ({
      ...bug.toObject(),
      days_overdue: Math.floor((today - new Date(bug.due_date)) / (1000 * 60 * 60 * 24))
    }));
    
    res.status(200).json({
      success: true,
      data: {
        tasks: tasksWithOverdue,
        bugs: bugsWithOverdue
      }
    });
  } catch (error) {
    console.error('Get overdue items error:', error);
    res.status(500).json({ success: false, message: 'Error fetching overdue items' });
  }
};

// @desc    Get project-specific dashboard
// @route   GET /api/projects/:id/dashboard
// @access  Private
const getProjectDashboard = async (req, res) => {
  try {
    const projectId = req.params.id;
    
    const project = await Project.findOne({
      _id: projectId,
      company_id: req.user.company_id
    }).populate('owner', 'first_name last_name email')
      .populate('team_members', 'first_name last_name email');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const [
      taskStats,
      bugStats,
      timeLogStats,
      recentTasks,
      recentBugs
    ] = await Promise.all([
      Task.aggregate([
        { $match: { project_id: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Bug.aggregate([
        { $match: { project_id: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      TimeLog.getAggregatedHours({ project_id: project._id }),
      Task.find({ project_id: projectId })
        .populate('assignee', 'first_name last_name')
        .sort({ updated_at: -1 })
        .limit(5),
      Bug.find({ project_id: projectId })
        .populate('assignee', 'first_name last_name')
        .sort({ updated_at: -1 })
        .limit(5)
    ]);
    
    // Calculate completion rates
    const totalTasks = taskStats.reduce((sum, s) => sum + s.count, 0);
    const completedTasks = taskStats.find(s => s._id === 'Completed')?.count || 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const totalBugs = bugStats.reduce((sum, s) => sum + s.count, 0);
    const closedBugs = bugStats.find(s => s._id === 'Closed')?.count || 0;
    const bugResolutionRate = totalBugs > 0 ? Math.round((closedBugs / totalBugs) * 100) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        project,
        stats: {
          task_completion_rate: taskCompletionRate,
          bug_resolution_rate: bugResolutionRate,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          total_bugs: totalBugs,
          closed_bugs: closedBugs,
          time_logs: timeLogStats
        },
        task_breakdown: taskStats,
        bug_breakdown: bugStats,
        recent_tasks: recentTasks,
        recent_bugs: recentBugs
      }
    });
  } catch (error) {
    console.error('Get project dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching project dashboard' });
  }
};

module.exports = {
  getDashboardStats,
  getMyTasks,
  getDueToday,
  getOverdueItems,
  getProjectDashboard
};
