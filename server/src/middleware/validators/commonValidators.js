/**
 * Common Validation Middleware
 * 
 * Shared validation utilities used across different route files
 */

const { validationResult } = require('express-validator');

/**
 * Validation middleware for handling validation errors
 * Checks for validation errors and returns standardized error response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

module.exports = {
  handleValidationErrors
};
