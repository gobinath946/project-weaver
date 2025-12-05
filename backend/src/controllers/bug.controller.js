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
    { created_by: user.id },
    { followers: user.id }
  ];
  
  return query;
};

// @desc    Get all bugs with pagination and filters
// @route   GET /api/bugs
// @access  Private
const getBugs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      severity, 
      project_id,
      project_group,
      assignee,
      reporter,
      classification,
      tags,
      flag,
      search, 
      sort = '-created_at',
      group_by
    } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    
    // Apply filters
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (project_id) query.project_id = project_id;
    if (assignee) query.assignee = assignee;
    if (reporter) query.reporter = reporter;
    if (classification) query.classification = classification;
    if (flag) query.flag = flag;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { bug_id: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle project group filter
    if (project_group) {
      const projects = await Project.find({ 
        project_group: project_group, 
        company_id: req.user.company_id 
      }).select('_id');
      query.project_id = { $in: projects.map(p => p._id) };
    }

    // Handle grouped response
    if (group_by === 'project') {
      const bugs = await Bug.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'projects',
            localField: 'project_id',
            foreignField: '_id',
            as: 'project'
          }
        },
        { $unwind: '$project' },
        {
          $group: {
            _id: '$project_id',
            project_title: { $first: '$project.title' },
            project_id_str: { $first: '$project.project_id' },
            bugs: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        { $sort: { project_title: 1 } }
      ]);

      // Populate bugs in each group
      for (let group of bugs) {
        group.bugs = await Bug.populate(group.bugs, [
          { path: 'assignee', select: 'first_name last_name email' },
          { path: 'reporter', select: 'first_name last_name email' },
          { path: 'project_id', select: 'title project_id' }
        ]);
      }

      return res.status(200).json({
        success: true,
        data: bugs
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [bugs, total] = await Promise.all([
      Bug.find(query)
        .populate('assignee', 'first_name last_name email')
        .populate('reporter', 'first_name last_name email')
        .populate('project_id', 'title project_id')
        .populate('created_by', 'first_name last_name email')
        .populate('last_modified_by', 'first_name last_name email')
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

// @desc    Get single bug with full details
// @route   GET /api/bugs/:id
// @access  Private
const getBug = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    
    const bug = await Bug.findOne(query)
      .populate('assignee', 'first_name last_name email')
      .populate('reporter', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .populate('task_id', 'name task_id')
      .populate('followers', 'first_name last_name email')
      .populate('linked_bugs', 'bug_id title status severity')
      .populate('associated_tasks', 'task_id name status')
      .populate('created_by', 'first_name last_name email')
      .populate('last_modified_by', 'first_name last_name email');
    
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
      title, description, project_id, task_id, assignee, followers,
      severity, classification, module, reproducible, flag, due_date, tags,
      release_milestone, affected_milestone
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
      title, 
      description, 
      project_id, 
      task_id,
      company_id: req.user.company_id,
      reporter: req.user.id,
      assignee,
      followers: followers || [],
      severity: severity || 'None',
      classification: classification || 'None',
      module, 
      reproducible: reproducible || 'None',
      flag: flag || 'Internal',
      due_date, 
      tags: tags || [],
      release_milestone,
      affected_milestone,
      created_by: req.user.id,
      last_modified_by: req.user.id
    });
    
    await bug.save();
    
    // Update project bug count
    if (project.updateBugCounts) {
      await project.updateBugCounts();
    }
    
    await bug.populate('assignee', 'first_name last_name email');
    await bug.populate('reporter', 'first_name last_name email');
    await bug.populate('project_id', 'title project_id');
    await bug.populate('followers', 'first_name last_name email');
    
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
      'title', 'description', 'task_id', 'assignee', 'status', 'followers',
      'severity', 'classification', 'module', 'reproducible', 'flag', 
      'due_date', 'tags', 'linked_bugs', 'associated_tasks',
      'release_milestone', 'affected_milestone', 'completion_percentage'
    ];
    
    const oldStatus = bug.status;
    
    // Validate status transition if status is being updated
    if (req.body.status && req.body.status !== oldStatus) {
      const validTransitions = Bug.validStatusTransitions[oldStatus];
      if (validTransitions && !validTransitions.includes(req.body.status)) {
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

    bug.last_modified_by = req.user.id;
    
    await bug.save();
    
    // Update project counts if status changed
    if (oldStatus !== bug.status) {
      const project = await Project.findById(bug.project_id);
      if (project && project.updateBugCounts) {
        await project.updateBugCounts();
      }
    }
    
    await bug.populate('assignee', 'first_name last_name email');
    await bug.populate('reporter', 'first_name last_name email');
    await bug.populate('project_id', 'title project_id');
    await bug.populate('followers', 'first_name last_name email');
    await bug.populate('linked_bugs', 'bug_id title status severity');
    await bug.populate('associated_tasks', 'task_id name status');
    
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
    if (project && project.updateBugCounts) {
      await project.updateBugCounts();
    }
    
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

// @desc    Get bugs grouped by project or none
// @route   GET /api/bugs/grouped
// @access  Private
const getBugsGrouped = async (req, res) => {
  try {
    const { group_by = 'none', ...filters } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.project_id) query.project_id = filters.project_id;
    if (filters.assignee) query.assignee = filters.assignee;
    if (filters.reporter) query.reporter = filters.reporter;
    if (filters.classification) query.classification = filters.classification;
    if (filters.flag) query.flag = filters.flag;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { bug_id: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (group_by === 'project') {
      const bugs = await Bug.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'projects',
            localField: 'project_id',
            foreignField: '_id',
            as: 'project'
          }
        },
        { $unwind: '$project' },
        {
          $group: {
            _id: '$project_id',
            group_name: { $first: '$project.title' },
            group_id: { $first: '$project.project_id' },
            items: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        { $sort: { group_name: 1 } }
      ]);

      // Populate bugs in each group
      for (let group of bugs) {
        group.items = await Bug.populate(group.items, [
          { path: 'assignee', select: 'first_name last_name email' },
          { path: 'reporter', select: 'first_name last_name email' },
          { path: 'project_id', select: 'title project_id' }
        ]);
      }

      return res.status(200).json({
        success: true,
        data: bugs
      });
    }

    // Default: no grouping
    const bugs = await Bug.find(query)
      .populate('assignee', 'first_name last_name email')
      .populate('reporter', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .sort('-created_at');

    res.status(200).json({
      success: true,
      data: bugs
    });
  } catch (error) {
    console.error('Get bugs grouped error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bugs' });
  }
};

// @desc    Link bugs together
// @route   POST /api/bugs/:id/link
// @access  Private
const linkBug = async (req, res) => {
  try {
    const { linked_bug_id } = req.body;
    const bug = await Bug.findOne({ _id: req.params.id, company_id: req.user.company_id });
    
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    if (!bug.linked_bugs.includes(linked_bug_id)) {
      bug.linked_bugs.push(linked_bug_id);
      await bug.save();
    }

    // Also link the other bug back
    const linkedBug = await Bug.findById(linked_bug_id);
    if (linkedBug && !linkedBug.linked_bugs.includes(req.params.id)) {
      linkedBug.linked_bugs.push(req.params.id);
      await linkedBug.save();
    }

    await bug.populate('linked_bugs', 'bug_id title status severity');

    res.status(200).json({
      success: true,
      message: 'Bug linked successfully',
      data: bug
    });
  } catch (error) {
    console.error('Link bug error:', error);
    res.status(500).json({ success: false, message: 'Error linking bug' });
  }
};

// @desc    Associate task with bug
// @route   POST /api/bugs/:id/associate-task
// @access  Private
const associateTask = async (req, res) => {
  try {
    const { task_id } = req.body;
    const bug = await Bug.findOne({ _id: req.params.id, company_id: req.user.company_id });
    
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    if (!bug.associated_tasks.includes(task_id)) {
      bug.associated_tasks.push(task_id);
      await bug.save();
    }

    await bug.populate('associated_tasks', 'task_id name status');

    res.status(200).json({
      success: true,
      message: 'Task associated successfully',
      data: bug
    });
  } catch (error) {
    console.error('Associate task error:', error);
    res.status(500).json({ success: false, message: 'Error associating task' });
  }
};

module.exports = {
  getBugs,
  getBug,
  createBug,
  updateBug,
  deleteBug,
  getBugsByProject,
  getBugsKanban,
  getBugsGrouped,
  linkBug,
  associateTask
};
