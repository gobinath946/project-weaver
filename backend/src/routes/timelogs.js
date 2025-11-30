const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const timeLogController = require('../controllers/timeLogController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', timeLogController.getTimeLogs);
router.get('/:id', timeLogController.getTimeLog);

router.post('/', validate([
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('hours').isFloat({ min: 0 }).withMessage('Hours must be a positive number'),
  body('billingType').isIn(['Billable', 'Non_Billable']).withMessage('Invalid billing type')
]), timeLogController.createTimeLog);

router.put('/:id', timeLogController.updateTimeLog);
router.delete('/:id', timeLogController.deleteTimeLog);

module.exports = router;
