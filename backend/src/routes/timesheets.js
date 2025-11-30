const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const timesheetController = require('../controllers/timesheetController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', timesheetController.getTimesheets);
router.get('/:id', timesheetController.getTimesheet);

router.post('/', validate([
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
]), timesheetController.createTimesheet);

router.post('/:id/submit', timesheetController.submitTimesheet);

router.post('/:id/approve', authorize('Super_Admin', 'Admin', 'Project_Manager'), timesheetController.approveTimesheet);

router.post('/:id/reject', authorize('Super_Admin', 'Admin', 'Project_Manager'), validate([
  body('reason').trim().notEmpty().withMessage('Rejection reason is required')
]), timesheetController.rejectTimesheet);

module.exports = router;
