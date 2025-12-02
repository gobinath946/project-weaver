const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksKanban
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// All routes require authentication
router.use(protect);

// @route   GET /api/tasks/kanban
router.get('/kanban', getTasksKanban);

// @route   GET /api/tasks
router.get('/', getTasks);

// @route   GET /api/tasks/:id
router.get('/:id', getTask);

// @route   POST /api/tasks
router.post(
  '/',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Name is required and must be less than 200 characters'),
    body('project_id')
      .notEmpty()
      .withMessage('Project ID is required')
  ],
  validateRequest,
  createTask
);

// @route   PUT /api/tasks/:id
router.put('/:id', updateTask);

// @route   DELETE /api/tasks/:id
router.delete('/:id', deleteTask);

// @route   GET /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', getTasksByProject);

module.exports = router;
