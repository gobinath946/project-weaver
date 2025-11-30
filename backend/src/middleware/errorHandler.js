const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?._id
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = {
      code: 'INVALID_ID',
      message: 'Resource not found',
      statusCode: 404
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      code: 'DUPLICATE_FIELD',
      message: `${field} already exists`,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      code: 'VALIDATION_ERROR',
      message: messages.join(', '),
      details: err.errors,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      code: 'TOKEN_EXPIRED',
      message: 'Token has expired',
      statusCode: 401
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'SERVER_ERROR',
      message: error.message || 'Server Error',
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
};

module.exports = errorHandler;
