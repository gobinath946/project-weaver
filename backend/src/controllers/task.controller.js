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
    { current_owner: user.id },
    { owners: user.id },
    { created_by: user.id }
  ];
  
  return query;
};

// @desc    Get all tasks with pagination and filters
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
      task_list_id,
      assignee,
      owner,
      current_owner,
      billing_type,
      tags,
      search,
      start_date_from,
      start_date_to,
      due_date_from,
      due_date_to,
      created_from,
      created_to,
      created_by,
      time_span,
      group_by,
      sort = '-created_at',
      filter_mode = 'all'
    } = req.query;
    
    const query = buildRoleBasedQuery(req.user);
    
    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project_id) query.project_id = project_id;
    if (task_list_id) query.task_list_id = task_list_id === 'none' ? null : task_list_id;
    if (assignee) query.assignee = assignee;
    if (owner) query.$or = [{ owner: owner }, { owners: owner }];
    if (current_owner) query.current_owner = current_owner;
    if (billing_type) query.billing_type = billing_type;
    if (created_by) query.created_by = created_by;
    
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { task_id: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date filters
    if (start_date_from || start_date_to) {
      query.start_date = {};
      if (start_date_from) query.start_date.$gte = new Date(start_date_from);
      if (start_date_to) query.start_date.$lte = new Date(start_date_to);
    }
    
    if (due_date_from || due_date_to) {
      query.due_date = {};
      if (due_date_from) query.due_date.$gte = new Date(due_date_from);
      if (due_date_to) query.due_date.$lte = new Date(due_date_to);
    }
    
    if (created_from || created_to) {
      query.created_at = {};
      if (created_from) query.created_at.$gte = new Date(created_from);
      if (created_to) query.created_at.$lte = new Date(created_to);
    }
    
    // Time span filter
    if (time_span) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (time_span) {
        case 'today':
          query.due_date = { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
          break;
        case 'yesterday':
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          query.due_date = { $gte: yesterday, $lt: today };
          break;
        case 'tomorrow':
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          query.due_date = { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) };
          break;
        case 'this_week':
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
          query.due_date = { $gte: startOfWeek, $lt: endOfWeek };
          break;
        case 'last_week':
          const lastWeekStart = new Date(today.setDate(today.getDate() - today.getDay() - 7));
          const lastWeekEnd = new Date(lastWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          query.due_date = { $gte: lastWeekStart, $lt: lastWeekEnd };
          break;
        case 'next_week':
          const nextWeekStart = new Date(today.setDate(today.getDate() - today.getDay() + 7));
          const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          query.due_date = { $gte: nextWeekStart, $lt: nextWeekEnd };
          break;
        case 'this_month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          query.due_date = { $gte: startOfMonth, $lte: endOfMonth };
          break;
        case 'last_month':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          query.due_date = { $gte: lastMonthStart, $lte: lastMonthEnd };
          break;
        case 'next_month':
          const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
          query.due_date = { $gte: nextMonthStart, $lte: nextMonthEnd };
          break;
        case 'next_30_days':
          query.due_date = { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) };
          break;
      }
    }
    
    // Exclude subtasks from main list
    query.is_subtask = { $ne: true };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignee', 'first_name last_name email')
        .populate('owner', 'first_name last_name email')
        .populate('owners', 'first_name last_name email')
        .populate('current_owner', 'first_name last_name email')
        .populate('project_id', 'title project_id')
        .populate('task_list_id', 'name')
        .populate('created_by', 'first_name last_name email')
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

// @desc    Get tasks grouped by task list or project
// @route   GET /api/tasks/grouped
// @access  Private
const getTasksGrouped = async (req, res) => {
  try {
    const { group_by = 'task_list', project_id } = req.query;
    
    const baseQuery = { company_id: req.user.company_id, is_subtask: { $ne: true } };
    if (project_id) baseQuery.project_id = project_id;
    
    let result;
    
    if (group_by === 'task_list') {
      result = await Task.getGroupedByTaskList(baseQuery);
    } else if (group_by === 'project') {
      const projects = await Project.find({ company_id: req.user.company_id }).sort({ title: 1 });
      result = {};
      
      for (const project of projects) {
        const tasks = await Task.find({ ...baseQuery, project_id: project._id })
          .populate('assignee', 'first_name last_name email')
          .populate('current_owner', 'first_name last_name email')
          .populate('owners', 'first_name last_name email')
          .populate('project_id', 'title project_id')
          .populate('task_list_id', 'name')
          .sort({ created_at: -1 });
        
        if (tasks.length > 0) {
          result[project.title] = { project, tasks };
        }
      }
    }
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Get tasks grouped error:', error);
    res.status(500).json({ success: false, message: 'Error fetching grouped tasks' });
  }
};

// @desc    Get single task with full details
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    })
      .populate('assignee', 'first_name last_name email')
      .populate('owner', 'first_name last_name email')
      .populate('owners', 'first_name last_name email')
      .populate('current_owner', 'first_name last_name email')
      .populate('project_id', 'title project_id')
      .populate('task_list_id', 'name')
      .populate('created_by', 'first_name last_name email')
      .populate('work_hours_entries.user_id', 'first_name last_name email');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    // Get subtasks
    const subtasks = await Task.find({ parent_task_id: task._id })
      .populate('assignee', 'first_name last_name email')
      .populate('current_owner', 'first_name last_name email')
      .sort({ created_at: -1 });
    
    // Get related tasks from same project
    const relatedTasks = await Task.find({
      project_id: task.project_id._id,
      _id: { $ne: task._id },
      is_subtask: { $ne: true }
    })
      .populate('current_owner', 'first_name last_name email')
      .select('task_id name status current_owner')
      .sort({ created_at: -1 })
      .limit(50);
    
    res.status(200).json({ 
      success: true, 
      data: {
        ...task.toObject(),
        subtasks,
        relatedTasks
      }
    });
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
      name, description, project_id, task_list_id, 
      owners, current_owner, assignee, owner,
      status, priority, start_date, due_date, 
      total_estimation, estimation_split,
      work_hours, work_hours_type, work_hours_entries,
      tags, billing_type, outcome, reminder, recurrence,
      parent_task_id
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
      name, 
      description, 
      project_id, 
      task_list_id: task_list_id || null,
      company_id: req.user.company_id,
      owners: owners || [],
      current_owner: current_owner || req.user.id,
      assignee: assignee || current_owner || req.user.id,
      owner: owner || current_owner || req.user.id,
      status: status || '1-Dev/Open',
      priority: priority || 'None',
      start_date, 
      due_date, 
      total_estimation: total_estimation || 0,
      estimation_split: estimation_split || {},
      work_hours: work_hours || '0:00',
      work_hours_type: work_hours_type || 'Standard',
      work_hours_entries: work_hours_entries || [],
      tags: tags || [],
      billing_type: billing_type || 'None',
      outcome,
      reminder: reminder || 'None',
      recurrence,
      parent_task_id,
      is_subtask: !!parent_task_id,
      created_by: req.user.id
    });
    
    await task.save();
    
    // Update project task count
    await project.updateTaskCounts();
    
    // Update task list count if applicable
    if (task_list_id) {
      const taskList = await TaskList.findById(task_list_id);
      if (taskList) await taskList.updateTaskCounts();
    }
    
    // Update parent task subtask count
    if (parent_task_id) {
      await Task.findByIdAndUpdate(parent_task_id, { $inc: { subtask_count: 1 } });
    }
    
    await task.populate('assignee', 'first_name last_name email');
    await task.populate('current_owner', 'first_name last_name email');
    await task.populate('owners', 'first_name last_name email');
    await task.populate('project_id', 'title project_id');
    await task.populate('task_list_id', 'name');
    
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
    const task = await Task.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const allowedUpdates = [
      'name', 'description', 'task_list_id', 
      'owners', 'current_owner', 'assignee', 'owner', 'associated_team',
      'status', 'priority', 'start_date', 'due_date', 
      'total_estimation', 'estimation_split',
      'work_hours', 'work_hours_type', 'work_hours_entries',
      'work_hours_estimate', 'actual_hours', 'completion_percentage', 
      'tags', 'billing_type', 'outcome', 'reminder', 'recurrence'
    ];
    
    const oldStatus = task.status;
    const oldTaskListId = task.task_list_id;
    
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
    
    // Update task list counts if changed
    if (oldTaskListId?.toString() !== task.task_list_id?.toString()) {
      if (oldTaskListId) {
        const oldTaskList = await TaskList.findById(oldTaskListId);
        if (oldTaskList) await oldTaskList.updateTaskCounts();
      }
      if (task.task_list_id) {
        const newTaskList = await TaskList.findById(task.task_list_id);
        if (newTaskList) await newTaskList.updateTaskCounts();
      }
    }
    
    await task.populate('assignee', 'first_name last_name email');
    await task.populate('current_owner', 'first_name last_name email');
    await task.populate('owners', 'first_name last_name email');
    await task.populate('project_id', 'title project_id');
    await task.populate('task_list_id', 'name');
    
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
    const task = await Task.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const projectId = task.project_id;
    const taskListId = task.task_list_id;
    const parentTaskId = task.parent_task_id;
    
    // Delete subtasks
    await Task.deleteMany({ parent_task_id: req.params.id });
    
    await Task.deleteOne({ _id: req.params.id });
    
    // Update project task count
    const project = await Project.findById(projectId);
    if (project) await project.updateTaskCounts();
    
    // Update task list count
    if (taskListId) {
      const taskList = await TaskList.findById(taskListId);
      if (taskList) await taskList.updateTaskCounts();
    }
    
    // Update parent task subtask count
    if (parentTaskId) {
      await Task.findByIdAndUpdate(parentTaskId, { $inc: { subtask_count: -1 } });
    }
    
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
// @route   GET /api/tasks/projects/:projectId/tasks
// @access  Private
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, task_list_id, page = 1, limit = 50 } = req.query;
    
    const query = {
      project_id: projectId,
      company_id: req.user.company_id,
      is_subtask: { $ne: true }
    };
    
    if (status) query.status = status;
    if (task_list_id) query.task_list_id = task_list_id === 'none' ? null : task_list_id;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignee', 'first_name last_name email')
        .populate('current_owner', 'first_name last_name email')
        .populate('owners', 'first_name last_name email')
        .populate('task_list_id', 'name')
        .populate('project_id', 'title project_id')
        .sort({ created_at: -1 })
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
    
    if (!project_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required for kanban view' 
      });
    }
    
    const query = {
      company_id: req.user.company_id,
      project_id,
      is_subtask: { $ne: true }
    };
    
    const kanbanData = await Task.getKanbanData(query);
    
    res.status(200).json({ success: true, data: kanbanData });
  } catch (error) {
    console.error('Get tasks kanban error:', error);
    res.status(500).json({ success: false, message: 'Error fetching kanban data' });
  }
};

// @desc    Get all task lists with tasks count
// @route   GET /api/tasks/task-lists
// @access  Private
const getAllTaskLists = async (req, res) => {
  try {
    const { project_id } = req.query;
    
    const query = { company_id: req.user.company_id };
    if (project_id) query.project_id = project_id;
    
    const taskLists = await TaskList.find(query)
      .populate('project_id', 'title project_id')
      .populate('created_by', 'first_name last_name')
      .sort({ order: 1 });
    
    res.status(200).json({ success: true, data: taskLists });
  } catch (error) {
    console.error('Get all task lists error:', error);
    res.status(500).json({ success: false, message: 'Error fetching task lists' });
  }
};

// @desc    Get subtasks for a task
// @route   GET /api/tasks/:id/subtasks
// @access  Private
const getSubtasks = async (req, res) => {
  try {
    const subtasks = await Task.find({
      parent_task_id: req.params.id,
      company_id: req.user.company_id
    })
      .populate('assignee', 'first_name last_name email')
      .populate('current_owner', 'first_name last_name email')
      .sort({ created_at: -1 });
    
    res.status(200).json({ success: true, data: subtasks });
  } catch (error) {
    console.error('Get subtasks error:', error);
    res.status(500).json({ success: false, message: 'Error fetching subtasks' });
  }
};

module.exports = {
  getTasks,
  getTasksGrouped,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksKanban,
  getAllTaskLists,
  getSubtasks
};
