const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getTimeLogs,
  getTimeLog,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog,
  approveTimeLog,
  rejectTimeLog,
  getTimeLogAggregates
} = require('../controllers/timeLog.controller');
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

// @route   GET /api/timelogs/aggregates
router.get('/aggregates', getTimeLogAggregates);

// @route   GET /api/timelogs
router.get('/', getTimeLogs);

// @route   GET /api/timelogs/:id
router.get('/:id', getTimeLog);

// @route   POST /api/timelogs
router.post(
  '/',
  [
    body('project_id')
      .notEmpty()
      .withMessage('Project ID is required'),
    body('date')
      .notEmpty()
      .withMessage('Date is required'),
    body('daily_log_hours')
      .isFloat({ min: 0, max: 24 })
      .withMessage('Hours must be between 0 and 24')
  ],
  validateRequest,
  createTimeLog
);

// @route   PUT /api/timelogs/:id
router.put('/:id', updateTimeLog);

// @route   DELETE /api/timelogs/:id
router.delete('/:id', deleteTimeLog);

// @route   PATCH /api/timelogs/:id/approve
router.patch('/:id/approve', approveTimeLog);

// @route   PATCH /api/timelogs/:id/reject
router.patch('/:id/reject', rejectTimeLog);

module.exports = router;
