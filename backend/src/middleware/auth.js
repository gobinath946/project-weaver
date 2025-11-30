const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Not authorized to access this route'
        }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'User account is inactive'
          }
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or expired'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.roles.some(role => roles.includes(role))) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to perform this action'
        }
      });
    }
    next();
  };
};

exports.checkCompanyAccess = async (req, res, next) => {
  try {
    const companyId = req.params.companyId || req.body.companyId;
    
    if (companyId && req.user.companyId?.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'COMPANY_ACCESS_DENIED',
          message: 'Access denied to this company'
        }
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
