const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const bugController = require('../controllers/bugController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', bugController.getBugs);
router.get('/:id', bugController.getBug);

router.post('/', validate([
  body('title').trim().notEmpty().withMessage('Bug title is required'),
  body('projectId').notEmpty().withMessage('Project ID is required')
]), bugController.createBug);

router.put('/:id', bugController.updateBug);
router.delete('/:id', bugController.deleteBug);

router.put('/:id/assign', validate([
  body('assignee').notEmpty().withMessage('Assignee is required')
]), bugController.assignBug);

router.put('/:id/status', validate([
  body('status').notEmpty().withMessage('Status is required')
]), bugController.updateStatus);

router.post('/:id/comments', validate([
  body('content').trim().notEmpty().withMessage('Comment content is required')
]), bugController.addComment);

router.get('/:id/comments', bugController.getComments);

module.exports = router;
