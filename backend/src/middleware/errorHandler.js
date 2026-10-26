/**
 * PingCraft Centralized Express Error Handler
 *
 * Ensures clean, standardized JSON error responses across all routes.
 * Sanitizes errors so internal stack traces, DB credentials, and server secrets are never leaked.
 */

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred';
  let errors = err.errors || undefined;

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id of '${err.value}'`;
  }

  // Mongoose Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A resource with that ${field} already exists.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error occurred';
    errors = Object.values(err.errors).map(val => val.message);
  }

  // Log error with request context
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
