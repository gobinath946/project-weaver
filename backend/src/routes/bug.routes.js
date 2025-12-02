const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getBugs,
  getBug,
  createBug,
  updateBug,
  deleteBug,
  getBugsByProject,
  getBugsKanban
} = require('../controllers/bug.controller');
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

// @route   GET /api/bugs/kanban
router.get('/kanban', getBugsKanban);

// @route   GET /api/bugs
router.get('/', getBugs);

// @route   GET /api/bugs/:id
router.get('/:id', getBug);

// @route   POST /api/bugs
router.post(
  '/',
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters'),
    body('project_id')
      .notEmpty()
      .withMessage('Project ID is required')
  ],
  validateRequest,
  createBug
);

// @route   PUT /api/bugs/:id
router.put('/:id', updateBug);

// @route   DELETE /api/bugs/:id
router.delete('/:id', deleteBug);

// @route   GET /api/projects/:projectId/bugs
router.get('/projects/:projectId/bugs', getBugsByProject);

module.exports = router;
