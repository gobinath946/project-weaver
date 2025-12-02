const Task = require('../models/Task');
const Project = require('../models/Project');
const TaskList = require('../models/TaskList');

// Helper function to build role-based query
const buildRoleBasedQuery = (user, baseQuery = {}) => {
  const query = { ...baseQuery, company_id: user.company_id };
  
  if (user.role === 'company_super_admin') {
    return query;
  }
  
  query.$or = [
    { assignee: user.id },
    { owner: user.id },
    { created_by: user.id }
  ];
  
  return query;
};

// @desc    Get all tasks with pagination
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority, 
      project_id, 
      assignee,
      search, 
      sort = '-created_at' 
    } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project_id) query.project_id = project_id;
    if (assignee) query.assignee = assignee;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignee', 'first_name last_name email')
        .populate('owner', 'first_name last_name email')
        .populate('project_id', 'title project_id')
        .populate('task_list_id', 'name')
        .sort(sort)
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
        has_more: skip + tasks.length < total
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    
    const task = await Task.findOne(query)
      .populate('assignee', 'first_name last_name email')
      .populate('owner', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .populate('task_list_id', 'name');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, message: 'Error fetching task' });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const {
      name, description, project_id, task_list_id, assignee, owner,
      status, priority, start_date, due_date, work_hours_estimate, tags
    } = req.body;
    
    if (!name || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Task name and project are required'
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
    
    // Verify task list if provided
    if (task_list_id) {
      const taskList = await TaskList.findOne({
        _id: task_list_id,
        project_id: project_id
      });
      
      if (!taskList) {
        return res.status(400).json({
          success: false,
          message: 'Task list not found in this project'
        });
      }
    }
    
    const task = new Task({
      name, description, project_id, task_list_id,
      company_id: req.user.company_id,
      assignee, owner: owner || req.user.id,
      status: status || 'Not Started',
      priority: priority || 'None',
      start_date, due_date, work_hours_estimate,
      tags: tags || [],
      created_by: req.user.id
    });
    
    await task.save();
    
    // Update project task count
    await project.updateTaskCounts();
    
    await task.populate('assignee', 'first_name last_name email');
    await task.populate('project_id', 'title project_id');
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Error creating task' });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    const task = await Task.findOne(query);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const allowedUpdates = [
      'name', 'description', 'task_list_id', 'assignee', 'owner',
      'status', 'priority', 'start_date', 'due_date', 
      'work_hours_estimate', 'actual_hours', 'completion_percentage', 'tags'
    ];
    
    const oldStatus = task.status;
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });
    
    await task.save();
    
    // Update project counts if status changed
    if (oldStatus !== task.status) {
      const project = await Project.findById(task.project_id);
      if (project) await project.updateTaskCounts();
    }
    
    await task.populate('assignee', 'first_name last_name email');
    await task.populate('project_id', 'title project_id');
    
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Error updating task' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const query = buildRoleBasedQuery(req.user, { _id: req.params.id });
    const task = await Task.findOne(query);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const projectId = task.project_id;
    await Task.deleteOne({ _id: req.params.id });
    
    // Update project task count
    const project = await Project.findById(projectId);
    if (project) await project.updateTaskCounts();
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Error deleting task' });
  }
};

// @desc    Get tasks by project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, task_list_id } = req.query;
    
    const query = {
      project_id: projectId,
      company_id: req.user.company_id
    };
    
    if (status) query.status = status;
    if (task_list_id) query.task_list_id = task_list_id;
    
    const tasks = await Task.find(query)
      .populate('assignee', 'first_name last_name email')
      .populate('task_list_id', 'name')
      .sort({ created_at: -1 });
    
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks by project error:', error);
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

// @desc    Get tasks grouped by status (Kanban)
// @route   GET /api/tasks/kanban
// @access  Private
const getTasksKanban = async (req, res) => {
  try {
    const { project_id } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    if (project_id) query.project_id = project_id;
    
    const kanbanData = await Task.getKanbanData(query);
    
    res.status(200).json({ success: true, data: kanbanData });
  } catch (error) {
    console.error('Get tasks kanban error:', error);
    res.status(500).json({ success: false, message: 'Error fetching kanban data' });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksKanban
};
