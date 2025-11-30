const Organization = require('../models/Organization');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');

exports.getOrganizations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = { companyId: req.user.companyId };

    const organizations = await Organization.find(query)
      .populate('createdBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Organization.countDocuments(query);

    res.json({
      success: true,
      data: organizations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' }
      });
    }

    // Check access
    if (organization.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrganization = async (req, res, next) => {
  try {
    const { name, description, companyId } = req.body;

    // Verify company access
    if (companyId !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this company' }
      });
    }

    const organization = await Organization.create({
      name,
      description,
      companyId,
      createdBy: req.user._id
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      resourceType: 'Organization',
      resourceId: organization._id,
      changes: { after: organization.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' }
      });
    }

    // Check access
    if (organization.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    const before = organization.toObject();
    const { name, description } = req.body;

    if (name) organization.name = name;
    if (description !== undefined) organization.description = description;

    await organization.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Organization',
      resourceId: organization._id,
      changes: { before, after: organization.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' }
      });
    }

    // Check access
    if (organization.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    // Soft delete
    organization.deletedAt = new Date();
    await organization.save();

    // Soft delete all projects in this organization
    await Project.updateMany(
      { organizationId: organization._id },
      { deletedAt: new Date() }
    );

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      resourceType: 'Organization',
      resourceId: organization._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
