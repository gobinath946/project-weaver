const TaskList = require('../models/TaskList');
const Project = require('../models/Project');

// @desc    Get task lists by project
// @route   GET /api/projects/:projectId/task-lists
// @access  Private
const getTaskLists = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      company_id: req.user.company_id
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const taskLists = await TaskList.find({
      project_id: projectId,
      company_id: req.user.company_id
    })
      .populate('created_by', 'first_name last_name email')
      .sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      data: taskLists
    });
  } catch (error) {
    console.error('Get task lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task lists'
    });
  }
};

// @desc    Create task list
// @route   POST /api/projects/:projectId/task-lists
// @access  Private
const createTaskList = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    
    // Verify project exists
    const project = await Project.findOne({
      _id: projectId,
      company_id: req.user.company_id
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Task list name is required'
      });
    }
    
    // Get max order for new task list
    const maxOrder = await TaskList.findOne({ project_id: projectId })
      .sort({ order: -1 })
      .select('order');
    
    const taskList = new TaskList({
      name,
      description,
      project_id: projectId,
      company_id: req.user.company_id,
      order: maxOrder ? maxOrder.order + 1 : 0,
      created_by: req.user.id
    });
    
    await taskList.save();
    
    res.status(201).json({
      success: true,
      message: 'Task list created successfully',
      data: taskList
    });
  } catch (error) {
    console.error('Create task list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task list'
    });
  }
};

// @desc    Update task list
// @route   PUT /api/task-lists/:id
// @access  Private
const updateTaskList = async (req, res) => {
  try {
    const taskList = await TaskList.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });
    
    if (!taskList) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found'
      });
    }
    
    const { name, description, is_active } = req.body;
    
    if (name !== undefined) taskList.name = name;
    if (description !== undefined) taskList.description = description;
    if (is_active !== undefined) taskList.is_active = is_active;
    
    await taskList.save();
    
    res.status(200).json({
      success: true,
      message: 'Task list updated successfully',
      data: taskList
    });
  } catch (error) {
    console.error('Update task list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task list'
    });
  }
};

// @desc    Delete task list
// @route   DELETE /api/task-lists/:id
// @access  Private
const deleteTaskList = async (req, res) => {
  try {
    const taskList = await TaskList.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });
    
    if (!taskList) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found'
      });
    }
    
    // Update tasks to remove task_list_id reference
    const Task = require('../models/Task');
    await Task.updateMany(
      { task_list_id: req.params.id },
      { $set: { task_list_id: null } }
    );
    
    await TaskList.deleteOne({ _id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Task list deleted successfully'
    });
  } catch (error) {
    console.error('Delete task list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task list'
    });
  }
};

// @desc    Reorder task lists
// @route   PUT /api/projects/:projectId/task-lists/reorder
// @access  Private
const reorderTaskLists = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { order } = req.body; // Array of { id, order }
    
    if (!Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: 'Order must be an array'
      });
    }
    
    // Update each task list's order
    const updatePromises = order.map(item =>
      TaskList.updateOne(
        { _id: item.id, project_id: projectId, company_id: req.user.company_id },
        { $set: { order: item.order } }
      )
    );
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'Task lists reordered successfully'
    });
  } catch (error) {
    console.error('Reorder task lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering task lists'
    });
  }
};

module.exports = {
  getTaskLists,
  createTaskList,
  updateTaskList,
  deleteTaskList,
  reorderTaskLists
};
