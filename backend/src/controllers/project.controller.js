const Project = require('../models/Project');
const User = require('../models/User');

// Helper function to build role-based query
const buildRoleBasedQuery = (user, baseQuery = {}) => {
  const query = { ...baseQuery, company_id: user.company_id };
  
  // company_super_admin sees all projects
  if (user.role === 'company_super_admin') {
    return query;
  }
  
  // company_admin sees only projects they own or are team members of
  query.$or = [
    { owner: user.id },
    { team_members: user.id },
    { created_by: user.id }
  ];
  
  return query;
};

// @desc    Get all projects with pagination
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sort = '-created_at' } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'first_name last_name email')
        .populate('team_members', 'first_name last_name email')
        .populate('created_by', 'first_name last_name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_count: total,
        has_more: skip + projects.length < total
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    
    const project = await Project.findOne(query)
      .populate('owner', 'first_name last_name email')
      .populate('team_members', 'first_name last_name email')
      .populate('created_by', 'first_name last_name email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project'
    });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      owner,
      team_members,
      status,
      visibility,
      start_date,
      end_date,
      tags
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required'
      });
    }
    
    const project = new Project({
      title,
      description,
      owner: owner || req.user.id,
      team_members: team_members || [],
      company_id: req.user.company_id,
      status: status || 'Active',
      visibility: visibility || 'Private',
      start_date,
      end_date,
      tags: tags || [],
      created_by: req.user.id
    });
    
    await project.save();
    
    // Populate references before returning
    await project.populate('owner', 'first_name last_name email');
    await project.populate('team_members', 'first_name last_name email');
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    
    const project = await Project.findOne(query);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const allowedUpdates = [
      'title', 'description', 'owner', 'team_members', 'status',
      'visibility', 'start_date', 'end_date', 'tags', 'progress'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });
    
    await project.save();
    
    await project.populate('owner', 'first_name last_name email');
    await project.populate('team_members', 'first_name last_name email');
    
    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    
    const project = await Project.findOne(query);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await Project.deleteOne({ _id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
};

// @desc    Get project statistics
// @route   GET /api/projects/:id/stats
// @access  Private
const getProjectStats = async (req, res) => {
  try {
    const Task = require('../models/Task');
    const Bug = require('../models/Bug');
    const TimeLog = require('../models/TimeLog');
    
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    const project = await Project.findOne(query);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const [taskStats, bugStats, timeLogStats] = await Promise.all([
      Task.aggregate([
        { $match: { project_id: project._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Bug.aggregate([
        { $match: { project_id: project._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      TimeLog.getAggregatedHours({ project_id: project._id })
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        project,
        tasks: taskStats,
        bugs: bugStats,
        time_logs: timeLogStats
      }
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project statistics'
    });
  }
};

// @desc    Get users for project assignment
// @route   GET /api/projects/users
// @access  Private
const getProjectUsers = async (req, res) => {
  try {
    const users = await User.find({
      company_id: req.user.company_id,
      is_active: true
    }).select('first_name last_name email role');
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get project users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectUsers
};
