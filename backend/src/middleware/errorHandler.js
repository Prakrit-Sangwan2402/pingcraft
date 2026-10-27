const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An internal server error occurred';
  let errors = err.errors || undefined;

  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id '${err.value}'`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map(val => val.message);
  }

  logger.error(message, {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    error: process.env.NODE_ENV === 'production' ? err.name : err.stack
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
}

module.exports = errorHandler;
