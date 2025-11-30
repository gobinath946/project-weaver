const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const orgController = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', orgController.getOrganizations);
router.get('/:id', orgController.getOrganization);

router.post('/', authorize('Super_Admin', 'Admin'), validate([
  body('name').trim().notEmpty().withMessage('Organization name is required'),
  body('companyId').notEmpty().withMessage('Company ID is required')
]), orgController.createOrganization);

router.put('/:id', authorize('Super_Admin', 'Admin'), validate([
  body('name').optional().trim().notEmpty()
]), orgController.updateOrganization);

router.delete('/:id', authorize('Super_Admin', 'Admin'), orgController.deleteOrganization);

module.exports = router;
