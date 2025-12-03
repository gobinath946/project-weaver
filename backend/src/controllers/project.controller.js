const Project = require('../models/Project');
const ProjectGroup = require('../models/ProjectGroup');
const User = require('../models/User');

// Project Status Enum
const PROJECT_STATUS = Project.PROJECT_STATUS;

// Helper function to build role-based query
const buildRoleBasedQuery = (user, baseQuery = {}) => {
  const query = { ...baseQuery, company_id: user.company_id };
  
  if (user.role === 'company_super_admin') {
    return query;
  }
  
  query.$or = [
    { owner: user.id },
    { team_members: user.id },
    { allocated_users: user.id },
    { created_by: user.id }
  ];
  
  return query;
};

// @desc    Get all projects with pagination and advanced filtering
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sort = '-created_at',
      visibility,
      project_group,
      owner,
      created_by,
      start_date_from,
      start_date_to,
      end_date_from,
      end_date_to,
      created_from,
      created_to,
      modified_from,
      modified_to,
      last_modified_by,
      tags,
      strict_project,
      allocated_users,
      no_of_allocated_users_min,
      no_of_allocated_users_max,
      filter_mode = 'all' // 'any' or 'all'
    } = req.query;
    
    let query = buildRoleBasedQuery(req.user);
    const filterConditions = [];
    
    // Status filter
    if (status && status !== 'all') {
      filterConditions.push({ status });
    }
    
    // Visibility filter
    if (visibility && visibility !== 'all') {
      filterConditions.push({ visibility });
    }
    
    // Project group filter
    if (project_group) {
      filterConditions.push({ project_group });
    }
    
    // Owner filter
    if (owner) {
      filterConditions.push({ owner });
    }
    
    // Created by filter
    if (created_by) {
      filterConditions.push({ created_by });
    }
    
    // Last modified by filter
    if (last_modified_by) {
      filterConditions.push({ last_modified_by });
    }
    
    // Strict project filter
    if (strict_project !== undefined) {
      filterConditions.push({ strict_project: strict_project === 'true' });
    }
    
    // Search by title or project_id
    if (search) {
      filterConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { project_id: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    // Date range filters
    if (start_date_from || start_date_to) {
      const dateFilter = {};
      if (start_date_from) dateFilter.$gte = new Date(start_date_from);
      if (start_date_to) dateFilter.$lte = new Date(start_date_to);
      filterConditions.push({ start_date: dateFilter });
    }
    
    if (end_date_from || end_date_to) {
      const dateFilter = {};
      if (end_date_from) dateFilter.$gte = new Date(end_date_from);
      if (end_date_to) dateFilter.$lte = new Date(end_date_to);
      filterConditions.push({ end_date: dateFilter });
    }
    
    if (created_from || created_to) {
      const dateFilter = {};
      if (created_from) dateFilter.$gte = new Date(created_from);
      if (created_to) dateFilter.$lte = new Date(created_to);
      filterConditions.push({ created_at: dateFilter });
    }
    
    if (modified_from || modified_to) {
      const dateFilter = {};
      if (modified_from) dateFilter.$gte = new Date(modified_from);
      if (modified_to) dateFilter.$lte = new Date(modified_to);
      filterConditions.push({ updated_at: dateFilter });
    }
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      filterConditions.push({ tags: { $in: tagArray } });
    }
    
    // Allocated users filter
    if (allocated_users) {
      const userIds = allocated_users.split(',');
      filterConditions.push({ allocated_users: { $in: userIds } });
    }
    
    // Number of allocated users range
    if (no_of_allocated_users_min || no_of_allocated_users_max) {
      const countFilter = {};
      if (no_of_allocated_users_min) countFilter.$gte = parseInt(no_of_allocated_users_min);
      if (no_of_allocated_users_max) countFilter.$lte = parseInt(no_of_allocated_users_max);
      filterConditions.push({ no_of_allocated_users: countFilter });
    }
    
    // Apply filter conditions based on mode
    if (filterConditions.length > 0) {
      if (filter_mode === 'any') {
        query.$or = [...(query.$or || []), ...filterConditions];
      } else {
        query.$and = filterConditions;
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'first_name last_name email')
        .populate('team_members', 'first_name last_name email')
        .populate('allocated_users', 'first_name last_name email')
        .populate('created_by', 'first_name last_name email')
        .populate('last_modified_by', 'first_name last_name email')
        .populate('project_group', 'name color')
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
        per_page: parseInt(limit),
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

// @desc    Get projects by tab (active, public, completed)
// @route   GET /api/projects/by-tab/:tab
// @access  Private
const getProjectsByTab = async (req, res) => {
  try {
    const { tab } = req.params;
    const { page = 1, limit = 10, sort = '-created_at' } = req.query;
    
    let query = buildRoleBasedQuery(req.user);
    
    switch (tab) {
      case 'active':
        query.status = { $in: ['Active', 'In Progress', 'On Track', 'Planning', 'Yet to Start'] };
        break;
      case 'public':
        query.visibility = 'Public';
        break;
      case 'completed':
        query.status = { $in: ['Completed', 'Invoiced', 'Compl Yet to Mov'] };
        break;
      default:
        break;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'first_name last_name email')
        .populate('team_members', 'first_name last_name email')
        .populate('allocated_users', 'first_name last_name email')
        .populate('created_by', 'first_name last_name email')
        .populate('project_group', 'name color')
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
        per_page: parseInt(limit),
        has_more: skip + projects.length < total
      }
    });
  } catch (error) {
    console.error('Get projects by tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
};

// @desc    Get projects for Kanban view (grouped by status)
// @route   GET /api/projects/kanban
// @access  Private
const getProjectsKanban = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user);
    
    const projects = await Project.find(query)
      .populate('owner', 'first_name last_name email')
      .populate('allocated_users', 'first_name last_name email')
      .populate('project_group', 'name color')
      .sort('-updated_at');
    
    // Group by status
    const kanbanData = {};
    PROJECT_STATUS.forEach(status => {
      kanbanData[status] = [];
    });
    
    projects.forEach(project => {
      if (kanbanData[project.status]) {
        kanbanData[project.status].push(project);
      }
    });
    
    res.status(200).json({
      success: true,
      data: kanbanData,
      statuses: PROJECT_STATUS
    });
  } catch (error) {
    console.error('Get projects kanban error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching kanban data'
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
      .populate('allocated_users', 'first_name last_name email')
      .populate('created_by', 'first_name last_name email')
      .populate('last_modified_by', 'first_name last_name email')
      .populate('project_group', 'name color');
    
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
      allocated_users,
      allocated_time,
      status,
      visibility,
      strict_project,
      project_group,
      start_date,
      end_date,
      tags
    } = req.body;
    
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
      allocated_users: allocated_users || [],
      allocated_time: allocated_time || 0,
      company_id: req.user.company_id,
      status: status || 'Active',
      visibility: visibility || 'Private',
      strict_project: strict_project || false,
      project_group,
      start_date,
      end_date,
      tags: tags || [],
      created_by: req.user.id,
      last_modified_by: req.user.id
    });
    
    await project.save();
    
    // Update project group count if assigned
    if (project_group) {
      const group = await ProjectGroup.findById(project_group);
      if (group) {
        await group.updateProjectCount();
      }
    }
    
    await project.populate('owner', 'first_name last_name email');
    await project.populate('team_members', 'first_name last_name email');
    await project.populate('allocated_users', 'first_name last_name email');
    await project.populate('project_group', 'name color');
    
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
    
    const oldGroupId = project.project_group;
    
    const allowedUpdates = [
      'title', 'description', 'owner', 'team_members', 'allocated_users',
      'allocated_time', 'status', 'visibility', 'strict_project',
      'project_group', 'start_date', 'end_date', 'tags', 'progress'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });
    
    project.last_modified_by = req.user.id;
    
    await project.save();
    
    // Update project group counts if changed
    if (oldGroupId && oldGroupId.toString() !== project.project_group?.toString()) {
      const oldGroup = await ProjectGroup.findById(oldGroupId);
      if (oldGroup) await oldGroup.updateProjectCount();
    }
    if (project.project_group) {
      const newGroup = await ProjectGroup.findById(project.project_group);
      if (newGroup) await newGroup.updateProjectCount();
    }
    
    await project.populate('owner', 'first_name last_name email');
    await project.populate('team_members', 'first_name last_name email');
    await project.populate('allocated_users', 'first_name last_name email');
    await project.populate('project_group', 'name color');
    
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
    
    const groupId = project.project_group;
    
    await Project.deleteOne({ _id: req.params.id });
    
    // Update project group count
    if (groupId) {
      const group = await ProjectGroup.findById(groupId);
      if (group) await group.updateProjectCount();
    }
    
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
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Bug.aggregate([
        { $match: { project_id: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
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

// @desc    Get project status list
// @route   GET /api/projects/statuses
// @access  Private
const getProjectStatuses = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: PROJECT_STATUS
    });
  } catch (error) {
    console.error('Get project statuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statuses'
    });
  }
};

// ==================== PROJECT GROUPS ====================

// @desc    Get all project groups
// @route   GET /api/project-groups
// @access  Private
const getProjectGroups = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    
    const query = { company_id: req.user.company_id };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [groups, total] = await Promise.all([
      ProjectGroup.find(query)
        .populate('created_by', 'first_name last_name')
        .sort('name')
        .skip(skip)
        .limit(parseInt(limit)),
      ProjectGroup.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: groups,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_count: total,
        has_more: skip + groups.length < total
      }
    });
  } catch (error) {
    console.error('Get project groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project groups'
    });
  }
};

// @desc    Get single project group
// @route   GET /api/project-groups/:id
// @access  Private
const getProjectGroup = async (req, res) => {
  try {
    const group = await ProjectGroup.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    }).populate('created_by', 'first_name last_name');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Project group not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get project group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project group'
    });
  }
};

// @desc    Create project group
// @route   POST /api/project-groups
// @access  Private
const createProjectGroup = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project group name is required'
      });
    }
    
    // Check for duplicate name
    const existing = await ProjectGroup.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      company_id: req.user.company_id
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A project group with this name already exists'
      });
    }
    
    const group = new ProjectGroup({
      name,
      description,
      color: color || '#6366f1',
      company_id: req.user.company_id,
      created_by: req.user.id
    });
    
    await group.save();
    
    res.status(201).json({
      success: true,
      message: 'Project group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Create project group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project group'
    });
  }
};

// @desc    Update project group
// @route   PUT /api/project-groups/:id
// @access  Private
const updateProjectGroup = async (req, res) => {
  try {
    const group = await ProjectGroup.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Project group not found'
      });
    }
    
    const { name, description, color } = req.body;
    
    // Check for duplicate name if name is being changed
    if (name && name !== group.name) {
      const existing = await ProjectGroup.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        company_id: req.user.company_id,
        _id: { $ne: group._id }
      });
      
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A project group with this name already exists'
        });
      }
    }
    
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (color) group.color = color;
    
    await group.save();
    
    res.status(200).json({
      success: true,
      message: 'Project group updated successfully',
      data: group
    });
  } catch (error) {
    console.error('Update project group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project group'
    });
  }
};

// @desc    Delete project group
// @route   DELETE /api/project-groups/:id
// @access  Private
const deleteProjectGroup = async (req, res) => {
  try {
    const group = await ProjectGroup.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Project group not found'
      });
    }
    
    // Remove group reference from all projects
    await Project.updateMany(
      { project_group: group._id },
      { $unset: { project_group: 1 } }
    );
    
    await ProjectGroup.deleteOne({ _id: group._id });
    
    res.status(200).json({
      success: true,
      message: 'Project group deleted successfully'
    });
  } catch (error) {
    console.error('Delete project group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project group'
    });
  }
};

module.exports = {
  getProjects,
  getProjectsByTab,
  getProjectsKanban,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectUsers,
  getProjectStatuses,
  getProjectGroups,
  getProjectGroup,
  createProjectGroup,
  updateProjectGroup,
  deleteProjectGroup
};
