const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);

router.put('/:id', validate([
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('timezone').optional().trim()
]), userController.updateUser);

router.put('/:id/preferences', userController.updatePreferences);

router.post('/invite', authorize('Super_Admin', 'Admin'), validate([
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('role').notEmpty().withMessage('Role is required')
]), userController.inviteUser);

router.delete('/:id', authorize('Super_Admin', 'Admin'), userController.deleteUser);

module.exports = router;
