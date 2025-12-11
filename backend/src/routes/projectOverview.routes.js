const express = require('express');
const {
  getUserProjects,
  getUserTasks,
  getUserBugs,
  getUserStats,
  getProjectOverview
} = require('../controllers/projectOverview.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/user-projects', getUserProjects);
router.get('/user-tasks', getUserTasks);
router.get('/user-bugs', getUserBugs);
router.get('/user-stats', getUserStats);
router.get('/project/:id', getProjectOverview);

module.exports = router;
