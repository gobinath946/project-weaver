const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);

router.post('/', validate([
  body('name').trim().notEmpty().withMessage('Task name is required'),
  body('projectId').notEmpty().withMessage('Project ID is required')
]), taskController.createTask);

router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.post('/:id/assign', validate([
  body('assignees').isArray().withMessage('Assignees must be an array')
]), taskController.assignTask);

router.put('/:id/status', validate([
  body('status').notEmpty().withMessage('Status is required')
]), taskController.updateStatus);

router.post('/:id/dependencies', validate([
  body('dependsOnTaskId').notEmpty().withMessage('Dependency task ID is required')
]), taskController.addDependency);

router.delete('/:id/dependencies/:depId', taskController.removeDependency);

router.post('/:id/comments', validate([
  body('content').trim().notEmpty().withMessage('Comment content is required')
]), taskController.addComment);

router.get('/:id/comments', taskController.getComments);

// Task lists
router.get('/lists/project/:projectId', taskController.getTaskLists);
router.post('/lists', validate([
  body('name').trim().notEmpty().withMessage('Task list name is required'),
  body('projectId').notEmpty().withMessage('Project ID is required')
]), taskController.createTaskList);

module.exports = router;
