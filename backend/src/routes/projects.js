const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const projectController = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);

router.post('/', authorize('Super_Admin', 'Admin', 'Project_Manager'), validate([
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('organizationId').notEmpty().withMessage('Organization ID is required')
]), projectController.createProject);

router.put('/:id', authorize('Super_Admin', 'Admin', 'Project_Manager'), projectController.updateProject);

router.delete('/:id', authorize('Super_Admin', 'Admin', 'Project_Manager'), projectController.deleteProject);

router.post('/:id/team', authorize('Super_Admin', 'Admin', 'Project_Manager'), validate([
  body('userId').notEmpty().withMessage('User ID is required')
]), projectController.addTeamMember);

router.delete('/:id/team/:userId', authorize('Super_Admin', 'Admin', 'Project_Manager'), projectController.removeTeamMember);

router.post('/:id/milestones', authorize('Super_Admin', 'Admin', 'Project_Manager'), validate([
  body('name').trim().notEmpty().withMessage('Milestone name is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
]), projectController.createMilestone);

router.get('/:id/milestones', projectController.getMilestones);

module.exports = router;
