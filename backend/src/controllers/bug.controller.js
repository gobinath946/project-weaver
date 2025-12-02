const Bug = require('../models/Bug');
const Project = require('../models/Project');

// Helper function to build role-based query
const buildRoleBasedQuery = (user, baseQuery = {}) => {
  const query = { ...baseQuery, company_id: user.company_id };
  
  if (user.role === 'company_super_admin') {
    return query;
  }
  
  query.$or = [
    { assignee: user.id },
    { reporter: user.id },
    { created_by: user.id }
  ];
  
  return query;
};

// @desc    Get all bugs with pagination
// @route   GET /api/bugs
// @access  Private
const getBugs = async (req, res) => {
  try {
    const { 
      page = 1, limit = 20, status, severity, project_id, 
      assignee, search, sort = '-created_at' 
    } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (project_id) query.project_id = project_id;
    if (assignee) query.assignee = assignee;
    if (search) query.title = { $regex: search, $options: 'i' };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [bugs, total] = await Promise.all([
      Bug.find(query)
        .populate('assignee', 'first_name last_name email')
        .populate('reporter', 'first_name last_name email')
        .populate('project_id', 'title project_id')
        .sort(sort)
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
        has_more: skip + bugs.length < total
      }
    });
  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bugs' });
  }
};

// @desc    Get single bug
// @route   GET /api/bugs/:id
// @access  Private
const getBug = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    
    const bug = await Bug.findOne(query)
      .populate('assignee', 'first_name last_name email')
      .populate('reporter', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .populate('task_id', 'name task_id');
    
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }
    
    res.status(200).json({ success: true, data: bug });
  } catch (error) {
    console.error('Get bug error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bug' });
  }
};

// @desc    Create bug
// @route   POST /api/bugs
// @access  Private
const createBug = async (req, res) => {
  try {
    const {
      title, description, project_id, task_id, assignee,
      severity, classification, module, reproducible, due_date, tags
    } = req.body;
    
    if (!title || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Bug title and project are required'
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
    
    const bug = new Bug({
      title, description, project_id, task_id,
      company_id: req.user.company_id,
      reporter: req.user.id,
      assignee,
      severity: severity || 'None',
      classification: classification || 'Functional Bug',
      module, reproducible: reproducible || 'Always',
      due_date, tags: tags || [],
      created_by: req.user.id
    });
    
    await bug.save();
    
    // Update project bug count
    await project.updateBugCounts();
    
    await bug.populate('assignee', 'first_name last_name email');
    await bug.populate('reporter', 'first_name last_name email');
    await bug.populate('project_id', 'title project_id');
    
    res.status(201).json({
      success: true,
      message: 'Bug created successfully',
      data: bug
    });
  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({ success: false, message: 'Error creating bug' });
  }
};

// @desc    Update bug
// @route   PUT /api/bugs/:id
// @access  Private
const updateBug = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    const bug = await Bug.findOne(query);
    
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }
    
    const allowedUpdates = [
      'title', 'description', 'task_id', 'assignee', 'status',
      'severity', 'classification', 'module', 'reproducible', 'due_date', 'tags'
    ];
    
    const oldStatus = bug.status;
    
    // Validate status transition if status is being updated
    if (req.body.status && req.body.status !== oldStatus) {
      const validTransitions = Bug.validStatusTransitions[oldStatus];
      if (!validTransitions || !validTransitions.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${oldStatus} to ${req.body.status}`
        });
      }
    }
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        bug[field] = req.body[field];
      }
    });
    
    await bug.save();
    
    // Update project counts if status changed
    if (oldStatus !== bug.status) {
      const project = await Project.findById(bug.project_id);
      if (project) await project.updateBugCounts();
    }
    
    await bug.populate('assignee', 'first_name last_name email');
    await bug.populate('reporter', 'first_name last_name email');
    await bug.populate('project_id', 'title project_id');
    
    res.status(200).json({
      success: true,
      message: 'Bug updated successfully',
      data: bug
    });
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({ success: false, message: 'Error updating bug' });
  }
};

// @desc    Delete bug
// @route   DELETE /api/bugs/:id
// @access  Private
const deleteBug = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    const bug = await Bug.findOne(query);
    
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }
    
    const projectId = bug.project_id;
    await Bug.deleteOne({ _id: req.params.id });
    
    // Update project bug count
    const project = await Project.findById(projectId);
    if (project) await project.updateBugCounts();
    
    res.status(200).json({
      success: true,
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({ success: false, message: 'Error deleting bug' });
  }
};

// @desc    Get bugs by project
// @route   GET /api/projects/:projectId/bugs
// @access  Private
const getBugsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, severity } = req.query;
    
    const query = {
      project_id: projectId,
      company_id: req.user.company_id
    };
    
    if (status) query.status = status;
    if (severity) query.severity = severity;
    
    const bugs = await Bug.find(query)
      .populate('assignee', 'first_name last_name email')
      .populate('reporter', 'first_name last_name email')
      .sort({ created_at: -1 });
    
    res.status(200).json({ success: true, data: bugs });
  } catch (error) {
    console.error('Get bugs by project error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bugs' });
  }
};

// @desc    Get bugs grouped by status (Kanban)
// @route   GET /api/bugs/kanban
// @access  Private
const getBugsKanban = async (req, res) => {
  try {
    const { project_id } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    if (project_id) query.project_id = project_id;
    
    const kanbanData = await Bug.getKanbanData(query);
    
    res.status(200).json({ success: true, data: kanbanData });
  } catch (error) {
    console.error('Get bugs kanban error:', error);
    res.status(500).json({ success: false, message: 'Error fetching kanban data' });
  }
};

module.exports = {
  getBugs,
  getBug,
  createBug,
  updateBug,
  deleteBug,
  getBugsByProject,
  getBugsKanban
};
