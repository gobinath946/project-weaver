const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const TimeLog = require('../models/TimeLog');
const Timesheet = require('../models/Timesheet');
const AuditLog = require('../models/AuditLog');

exports.getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const companyId = req.user.companyId;

    // Get project summary
    const projectQuery = { companyId };
    if (!req.user.roles.some(r => ['Super_Admin', 'Admin'].includes(r))) {
      projectQuery['teamMembers.userId'] = userId;
    }

    const totalProjects = await Project.countDocuments(projectQuery);
    const activeProjects = await Project.countDocuments({ ...projectQuery, status: 'active' });

    // Get task summary
    const taskQuery = { assignees: userId };
    const totalTasks = await Task.countDocuments(taskQuery);
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: { $in: ['Completed', 'Done'] } });
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: { $nin: ['Completed', 'Done'] } });

    // Get bug summary
    const bugQuery = { assignee: userId };
    const totalBugs = await Bug.countDocuments(bugQuery);
    const openBugs = await Bug.countDocuments({ ...bugQuery, status: { $in: ['Open', 'In Progress'] } });

    // Get timesheet summary for current week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyTimeLogs = await TimeLog.find({
      userId,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    const weeklyHours = weeklyTimeLogs.reduce((sum, log) => sum + log.hours, 0);
    const billableHours = weeklyTimeLogs
      .filter(log => log.billingType === 'Billable')
      .reduce((sum, log) => sum + log.hours, 0);

    res.json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks
        },
        bugs: {
          total: totalBugs,
          open: openBugs
        },
        timesheet: {
          weeklyHours,
          billableHours,
          nonBillableHours: weeklyHours - billableHours
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectSummary = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const projectQuery = { companyId };
    if (!req.user.roles.some(r => ['Super_Admin', 'Admin'].includes(r))) {
      projectQuery['teamMembers.userId'] = req.user._id;
    }

    const projects = await Project.find(projectQuery)
      .select('name status startDate endDate')
      .limit(10)
      .sort({ updatedAt: -1 });

    // Calculate progress for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ projectId: project._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => 
          t.status === 'Completed' || t.status === 'Done'
        ).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project.toObject(),
          progress,
          totalTasks,
          completedTasks
        };
      })
    );

    res.json({
      success: true,
      data: projectsWithProgress
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskSummary = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignees: req.user._id })
      .populate('projectId', 'name')
      .select('name status priority dueDate projectId')
      .limit(10)
      .sort({ dueDate: 1 });

    // Group by status
    const byStatus = await Task.aggregate([
      { $match: { assignees: req.user._id, deletedAt: { $exists: false } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Group by priority
    const byPriority = await Task.aggregate([
      { $match: { assignees: req.user._id, deletedAt: { $exists: false } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        recent: tasks,
        byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTimesheetSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const timeLogs = await TimeLog.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end }
    }).populate('projectId', 'name');

    // Group by date
    const byDate = timeLogs.reduce((acc, log) => {
      const dateKey = log.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { billable: 0, nonBillable: 0 };
      }
      if (log.billingType === 'Billable') {
        acc[dateKey].billable += log.hours;
      } else {
        acc[dateKey].nonBillable += log.hours;
      }
      return acc;
    }, {});

    // Group by project
    const byProject = timeLogs.reduce((acc, log) => {
      const projectName = log.projectId?.name || 'Unknown';
      if (!acc[projectName]) {
        acc[projectName] = 0;
      }
      acc[projectName] += log.hours;
      return acc;
    }, {});

    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
    const billableHours = timeLogs
      .filter(log => log.billingType === 'Billable')
      .reduce((sum, log) => sum + log.hours, 0);

    res.json({
      success: true,
      data: {
        totalHours,
        billableHours,
        nonBillableHours: totalHours - billableHours,
        byDate,
        byProject
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingDeadlines = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const tasks = await Task.find({
      assignees: req.user._id,
      dueDate: { $gte: new Date(), $lte: endDate },
      status: { $nin: ['Completed', 'Done'] }
    })
      .populate('projectId', 'name')
      .select('name dueDate priority projectId')
      .sort({ dueDate: 1 })
      .limit(10);

    const bugs = await Bug.find({
      assignee: req.user._id,
      dueDate: { $gte: new Date(), $lte: endDate },
      status: { $nin: ['Closed', 'Resolved'] }
    })
      .populate('projectId', 'name')
      .select('title dueDate priority projectId')
      .sort({ dueDate: 1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        tasks,
        bugs
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getActivityFeed = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent audit logs for user's company
    const activities = await AuditLog.find({})
      .populate('userId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};
