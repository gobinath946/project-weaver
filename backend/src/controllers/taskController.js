const Task = require('../models/Task');
const TaskList = require('../models/TaskList');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

// Helper to check circular dependencies
const hasCircularDependency = async (taskId, dependsOnId, visited = new Set()) => {
  if (taskId === dependsOnId) return true;
  if (visited.has(dependsOnId)) return false;
  
  visited.add(dependsOnId);
  const task = await Task.findById(dependsOnId);
  if (!task) return false;

  for (const depId of task.dependencies) {
    if (await hasCircularDependency(taskId, depId.toString(), visited)) {
      return true;
    }
  }
  return false;
};

exports.getTasks = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      projectId, 
      status, 
      priority, 
      assignee,
      owner,
      startDate,
      dueDate,
      tags,
      taskListId,
      search 
    } = req.query;

    const query = {};

    // Build query based on filters
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignees = assignee;
    if (owner) query.owner = owner;
    if (taskListId) query.taskListId = taskListId;
    if (tags) query.tags = { $in: tags.split(',') };
    
    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }
    if (dueDate) {
      query.dueDate = { $lte: new Date(dueDate) };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Ensure user has access to project
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project || project.companyId.toString() !== req.user.companyId?.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'Access denied' }
        });
      }
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name')
      .populate('assignees', 'firstName lastName email avatar')
      .populate('owner', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('dependencies', 'name status')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'name companyId')
      .populate('assignees', 'firstName lastName email avatar')
      .populate('owner', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('dependencies', 'name status')
      .populate('parentTaskId', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { 
      name, description, projectId, taskListId, parentTaskId,
      assignees, status, priority, startDate, dueDate,
      billEstimate, billingType, tags
    } = req.body;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project || project.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this project' }
      });
    }

    // Verify assignees have project access
    if (assignees && assignees.length > 0) {
      const validAssignees = assignees.every(assigneeId =>
        project.teamMembers.some(m => m.userId.toString() === assigneeId)
      );
      if (!validAssignees) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ASSIGNEES', message: 'Some assignees do not have access to this project' }
        });
      }
    }

    const task = await Task.create({
      name,
      description,
      projectId,
      taskListId,
      parentTaskId,
      assignees: assignees || [],
      owner: req.user._id,
      status: status || 'Open',
      priority: priority || 'Medium',
      startDate,
      dueDate,
      billEstimate,
      billingType,
      tags,
      createdBy: req.user._id
    });

    // Create notifications for assignees
    if (assignees && assignees.length > 0) {
      const notifications = assignees.map(userId => ({
        userId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned to task "${task.name}"`,
        resourceType: 'task',
        resourceId: task._id
      }));
      await Notification.insertMany(notifications);

      // Emit real-time notifications
      const io = req.app.get('io');
      assignees.forEach(userId => {
        io.to(`user:${userId}`).emit('notification:new', {
          type: 'task_assigned',
          message: `You have been assigned to task "${task.name}"`
        });
      });
    }

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      resourceType: 'Task',
      resourceId: task._id,
      changes: { after: task.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
      });
    }

    const before = task.toObject();
    const updates = req.body;

    // Validate completion percentage
    if (updates.completionPercentage !== undefined) {
      if (updates.completionPercentage < 0 || updates.completionPercentage > 100) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PERCENTAGE', message: 'Completion percentage must be between 0 and 100' }
        });
      }
    }

    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'projectId') {
        task[key] = updates[key];
      }
    });

    await task.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project:${task.projectId}`).emit('task:updated', task);

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Task',
      resourceId: task._id,
      changes: { before, after: task.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
      });
    }

    task.deletedAt = new Date();
    await task.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      resourceType: 'Task',
      resourceId: task._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.assignTask = async (req, res, next) => {
  try {
    const { assignees } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
      });
    }

    // Verify project access for all assignees
    const project = await Project.findById(task.projectId);
    const validAssignees = assignees.every(assigneeId =>
      project.teamMembers.some(m => m.userId.toString() === assigneeId)
    );

    if (!validAssignees) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ASSIGNEES', message: 'Some assignees do not have access to this project' }
      });
    }

    const newAssignees = assignees.filter(
      id => !task.assignees.map(a => a.toString()).includes(id)
    );

    task.assignees = assignees;
    await task.save();

    // Notify new assignees
    if (newAssignees.length > 0) {
      const notifications = newAssignees.map(userId => ({
        userId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `You have been assigned to task "${task.name}"`,
        resourceType: 'task',
        resourceId: task._id
      }));
      await Notification.insertMany(notifications);
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
      });
    }

    const before = task.toObject();
    task.status = status;

    // Auto-update completion percentage for common statuses
    if (status === 'Completed' || status === 'Done') {
      task.completionPercentage = 100;
    }

    await task.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project:${task.projectId}`).emit('task:status_changed', {
      taskId: task._id,
      status: task.status,
      previousStatus: before.status
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Task',
      resourceId: task._id,
      changes: { before, after: task.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.addDependency = async (req, res, next) => {
  try {
    const { dependsOnTaskId } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
      });
    }

    // Check for circular dependency
    if (await hasCircularDependency(task._id.toString(), dependsOnTaskId)) {
      return res.status(409).json({
        success: false,
        error: { code: 'CIRCULAR_DEPENDENCY', message: 'This would create a circular dependency' }
      });
    }

    if (!task.dependencies.includes(dependsOnTaskId)) {
      task.dependencies.push(dependsOnTaskId);
      await task.save();
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.removeDependency = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
      });
    }

    task.dependencies = task.dependencies.filter(
      d => d.toString() !== req.params.depId
    );
    await task.save();

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { content, mentions } = req.body;

    const comment = await Comment.create({
      content,
      taskId: req.params.id,
      userId: req.user._id,
      mentions
    });

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      const task = await Task.findById(req.params.id);
      const notifications = mentions.map(userId => ({
        userId,
        type: 'comment_mention',
        title: 'Mentioned in Comment',
        message: `You were mentioned in a comment on task "${task.name}"`,
        resourceType: 'task',
        resourceId: task._id
      }));
      await Notification.insertMany(notifications);

      // Emit real-time notifications
      const io = req.app.get('io');
      mentions.forEach(userId => {
        io.to(`user:${userId}`).emit('notification:new', {
          type: 'comment_mention',
          message: `You were mentioned in a comment`
        });
      });
    }

    await comment.populate('userId', 'firstName lastName email avatar');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ taskId: req.params.id })
      .populate('userId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskLists = async (req, res, next) => {
  try {
    const taskLists = await TaskList.find({ projectId: req.params.projectId })
      .sort({ order: 1 });

    res.json({
      success: true,
      data: taskLists
    });
  } catch (error) {
    next(error);
  }
};

exports.createTaskList = async (req, res, next) => {
  try {
    const { name, projectId } = req.body;

    const count = await TaskList.countDocuments({ projectId });

    const taskList = await TaskList.create({
      name,
      projectId,
      order: count,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: taskList
    });
  } catch (error) {
    next(error);
  }
};
