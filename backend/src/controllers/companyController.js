const Company = require('../models/Company');
const Organization = require('../models/Organization');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');

exports.getCompanies = async (req, res, next) => {
  try {
    // Users can only see their own company
    const company = await Company.findById(req.user.companyId);

    res.json({
      success: true,
      data: company ? [company] : []
    });
  } catch (error) {
    next(error);
  }
};

exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMPANY_NOT_FOUND', message: 'Company not found' }
      });
    }

    // Check access
    if (company._id.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};

exports.createCompany = async (req, res, next) => {
  try {
    const { name, domain, logo, settings } = req.body;

    const company = await Company.create({
      name,
      domain,
      logo,
      settings,
      createdBy: req.user._id
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      resourceType: 'Company',
      resourceId: company._id,
      changes: { after: company.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMPANY_NOT_FOUND', message: 'Company not found' }
      });
    }

    // Check access
    if (company._id.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    const before = company.toObject();
    const { name, domain, logo, settings } = req.body;

    if (name) company.name = name;
    if (domain) company.domain = domain;
    if (logo) company.logo = logo;
    if (settings) company.settings = { ...company.settings, ...settings };

    await company.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      resourceType: 'Company',
      resourceId: company._id,
      changes: { before, after: company.toObject() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMPANY_NOT_FOUND', message: 'Company not found' }
      });
    }

    // Soft delete company and cascade
    company.deletedAt = new Date();
    await company.save();

    // Soft delete all organizations
    await Organization.updateMany(
      { companyId: company._id },
      { deletedAt: new Date() }
    );

    // Soft delete all projects
    await Project.updateMany(
      { companyId: company._id },
      { deletedAt: new Date() }
    );

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      resourceType: 'Company',
      resourceId: company._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
