const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectUsers
} = require('../controllers/project.controller');
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

// @route   GET /api/projects/users
router.get('/users', getProjectUsers);

// @route   GET /api/projects
router.get('/', getProjects);

// @route   GET /api/projects/:id
router.get('/:id', getProject);

// @route   GET /api/projects/:id/stats
router.get('/:id/stats', getProjectStats);

// @route   POST /api/projects
router.post(
  '/',
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters')
  ],
  validateRequest,
  createProject
);

// @route   PUT /api/projects/:id
router.put('/:id', updateProject);

// @route   DELETE /api/projects/:id
router.delete('/:id', deleteProject);

module.exports = router;
