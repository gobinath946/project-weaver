const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const TimeLog = require('../models/TimeLog');

// Get user-specific project overview
const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company_id;
    
    const projects = await Project.find({
      company_id: companyId,
      $or: [
        { owner: userId },
        { team_members: userId },
        { allocated_users: userId },
        { created_by: userId }
      ]
    })
      .populate('owner', 'first_name last_name email')
      .populate('team_members', 'first_name last_name email')
      .populate('allocated_users', 'first_name last_name email')
      .populate('project_group', 'name color')
      .sort('-updated_at');
    
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const [taskCount, bugCount, completedTasks, closedBugs] = await Promise.all([
          Task.countDocuments({ 
            project_id: project._id,
            $or: [{ assignee: userId }, { owner: userId }]
          }),
          Bug.countDocuments({ 
            project_id: project._id,
            $or: [{ assignee: userId }, { reporter: userId }]
          }),
          Task.countDocuments({ 
            project_id: project._id,
            status: 'Completed',
            $or: [{ assignee: userId }, { owner: userId }]
          }),
          Bug.countDocuments({ 
            project_id: project._id,
            status: 'Closed',
            $or: [{ assignee: userId }, { reporter: userId }]
          })
        ]);
        
        return {
          ...project.toObject(),
          user_stats: {
            total_tasks: taskCount,
            completed_tasks: completedTasks,
            total_bugs: bugCount,
            closed_bugs: closedBugs
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: projectsWithStats
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user projects' 
    });
  }
};

const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, status, priority, page = 1, limit = 20 } = req.query;
    
    const query = {
      company_id: req.user.company_id,
      $or: [{ assignee: userId }, { owner: userId }]
    };
    
    if (project_id) query.project_id = project_id;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('project_id', 'title project_id')
        .populate('assignee', 'first_name last_name email')
        .populate('owner', 'first_name last_name email')
        .sort({ due_date: 1, priority: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_count: total,
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user tasks' 
    });
  }
};

const getUserBugs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, status, severity, page = 1, limit = 20 } = req.query;
    
    const query = {
      company_id: req.user.company_id,
      $or: [{ assignee: userId }, { reporter: userId }]
    };
    
    if (project_id) query.project_id = project_id;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [bugs, total] = await Promise.all([
      Bug.find(query)
        .populate('project_id', 'title project_id')
        .populate('assignee', 'first_name last_name email')
        .populate('reporter', 'first_name last_name email')
        .sort({ due_date: 1, severity: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Bug.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: bugs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_count: total,
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user bugs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user bugs' 
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company_id;
    
    const [
      totalProjects,
      totalTasks,
      completedTasks,
      totalBugs,
      closedBugs,
      totalTimeLogged
    ] = await Promise.all([
      Project.countDocuments({
        company_id: companyId,
        $or: [
          { owner: userId },
          { team_members: userId },
          { allocated_users: userId }
        ]
      }),
      Task.countDocuments({
        company_id: companyId,
        $or: [{ assignee: userId }, { owner: userId }]
      }),
      Task.countDocuments({
        company_id: companyId,
        status: 'Completed',
        $or: [{ assignee: userId }, { owner: userId }]
      }),
      Bug.countDocuments({
        company_id: companyId,
        $or: [{ assignee: userId }, { reporter: userId }]
      }),
      Bug.countDocuments({
        company_id: companyId,
        status: 'Closed',
        $or: [{ assignee: userId }, { reporter: userId }]
      }),
      TimeLog.aggregate([
        {
          $match: {
            company_id: companyId,
            user_id: userId
          }
        },
        {
          $group: {
            _id: null,
            total_hours: { $sum: '$hours' }
          }
        }
      ])
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total_projects: totalProjects,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        open_tasks: totalTasks - completedTasks,
        total_bugs: totalBugs,
        closed_bugs: closedBugs,
        open_bugs: totalBugs - closedBugs,
        total_time_logged: totalTimeLogged[0]?.total_hours || 0,
        task_completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        bug_resolution_rate: totalBugs > 0 ? Math.round((closedBugs / totalBugs) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user statistics' 
    });
  }
};

const getProjectOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    
    const project = await Project.findOne({
      _id: projectId,
      company_id: req.user.company_id,
      $or: [
        { owner: userId },
        { team_members: userId },
        { allocated_users: userId }
      ]
    })
      .populate('owner', 'first_name last_name email')
      .populate('team_members', 'first_name last_name email')
      .populate('allocated_users', 'first_name last_name email')
      .populate('project_group', 'name color');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }
    
    const [
      userTasks,
      userBugs,
      userTimeLogs,
      taskStats,
      bugStats
    ] = await Promise.all([
      Task.find({
        project_id: projectId,
        $or: [{ assignee: userId }, { owner: userId }]
      })
        .populate('assignee', 'first_name last_name')
        .sort({ due_date: 1 })
        .limit(10),
      Bug.find({
        project_id: projectId,
        $or: [{ assignee: userId }, { reporter: userId }]
      })
        .populate('assignee', 'first_name last_name')
        .sort({ due_date: 1 })
        .limit(10),
      TimeLog.find({
        project_id: projectId,
        user_id: userId
      })
        .sort({ log_date: -1 })
        .limit(10),
      Task.aggregate([
        {
          $match: {
            project_id: project._id,
            $or: [{ assignee: userId }, { owner: userId }]
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Bug.aggregate([
        {
          $match: {
            project_id: project._id,
            $or: [{ assignee: userId }, { reporter: userId }]
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        project,
        user_tasks: userTasks,
        user_bugs: userBugs,
        user_time_logs: userTimeLogs,
        task_breakdown: taskStats,
        bug_breakdown: bugStats
      }
    });
  } catch (error) {
    console.error('Get project overview error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching project overview' 
    });
  }
};

module.exports = {
  getUserProjects,
  getUserTasks,
  getUserBugs,
  getUserStats,
  getProjectOverview
};
