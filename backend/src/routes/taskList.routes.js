const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getTaskLists,
  createTaskList,
  updateTaskList,
  deleteTaskList,
  reorderTaskLists
} = require('../controllers/taskList.controller');
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

// @route   GET /api/projects/:projectId/task-lists
router.get('/projects/:projectId/task-lists', getTaskLists);

// @route   POST /api/projects/:projectId/task-lists
router.post(
  '/projects/:projectId/task-lists',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name is required and must be less than 100 characters')
  ],
  validateRequest,
  createTaskList
);

// @route   PUT /api/projects/:projectId/task-lists/reorder
router.put('/projects/:projectId/task-lists/reorder', reorderTaskLists);

// @route   PUT /api/task-lists/:id
router.put('/task-lists/:id', updateTaskList);

// @route   DELETE /api/task-lists/:id
router.delete('/task-lists/:id', deleteTaskList);

module.exports = router;
