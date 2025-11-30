const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', dashboardController.getDashboardData);
router.get('/project-summary', dashboardController.getProjectSummary);
router.get('/task-summary', dashboardController.getTaskSummary);
router.get('/timesheet-summary', dashboardController.getTimesheetSummary);
router.get('/upcoming-deadlines', dashboardController.getUpcomingDeadlines);
router.get('/activity-feed', dashboardController.getActivityFeed);

module.exports = router;
