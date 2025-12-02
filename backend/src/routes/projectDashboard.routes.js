const express = require('express');
const {
  getDashboardStats,
  getMyTasks,
  getDueToday,
  getOverdueItems,
  getProjectDashboard
} = require('../controllers/projectDashboard.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/project-dashboard/stats
router.get('/stats', getDashboardStats);

// @route   GET /api/project-dashboard/my-tasks
router.get('/my-tasks', getMyTasks);

// @route   GET /api/project-dashboard/due-today
router.get('/due-today', getDueToday);

// @route   GET /api/project-dashboard/overdue
router.get('/overdue', getOverdueItems);

// @route   GET /api/projects/:id/dashboard
router.get('/projects/:id/dashboard', getProjectDashboard);

module.exports = router;
