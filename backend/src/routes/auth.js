const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', validate([
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('companyName').optional().trim()
]), authController.register);

router.post('/login', validate([
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
]), authController.login);

router.post('/refresh-token', authController.refreshToken);

router.post('/forgot-password', validate([
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
]), authController.forgotPassword);

router.post('/reset-password/:token', validate([
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
]), authController.resetPassword);

router.get('/verify-email/:token', authController.verifyEmail);

router.post('/logout', protect, authController.logout);

router.get('/me', protect, authController.getMe);

module.exports = router;
