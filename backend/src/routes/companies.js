const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const companyController = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompany);

router.post('/', authorize('Super_Admin'), validate([
  body('name').trim().notEmpty().withMessage('Company name is required')
]), companyController.createCompany);

router.put('/:id', authorize('Super_Admin', 'Admin'), validate([
  body('name').optional().trim().notEmpty()
]), companyController.updateCompany);

router.delete('/:id', authorize('Super_Admin'), companyController.deleteCompany);

module.exports = router;
