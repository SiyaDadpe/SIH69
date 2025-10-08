/**
 * Rate Limiter Middleware
 * 
 * Implements rate limiting to protect against brute-force attacks and API abuse.
 * Uses express-rate-limit with configurable limits from environment variables.
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Create a rate limiter with custom configuration
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: options.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: options.message || {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: undefined
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req, res, next, options) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('user-agent')
      });
      
      res.status(options.statusCode).json(options.message);
    },
    
    ...options
  };

  return rateLimit(defaultOptions);
};

/**
 * General API rate limiter
 * Applied to all API routes
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

/**
 * Strict rate limiter for authentication routes
 * Prevents brute-force attacks on login/register endpoints
 */
const authLimiter = createRateLimiter({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: false, // Count all auth attempts
  standardHeaders: true
});

/**
 * Moderate rate limiter for password reset routes
 * Prevents abuse of password reset functionality
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: parseInt(process.env.PASSWORD_RESET_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.PASSWORD_RESET_MAX) || 3, // 3 attempts per hour
  message: {
    success: false,
    error: 'Too many password reset requests. Please try again after an hour.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Rate limiter for file upload endpoints
 * Prevents abuse of upload functionality
 */
const uploadLimiter = createRateLimiter({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 10, // 10 uploads per hour
  message: {
    success: false,
    error: 'Upload limit exceeded. Please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Rate limiter for report generation endpoints
 * Prevents excessive resource consumption
 */
const reportLimiter = createRateLimiter({
  windowMs: parseInt(process.env.REPORT_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.REPORT_RATE_LIMIT_MAX) || 5, // 5 reports per hour
  message: {
    success: false,
    error: 'Report generation limit exceeded. Please try again later.',
    code: 'REPORT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Lenient rate limiter for public endpoints
 * Allows higher request volume for read-only operations
 */
const publicLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.PUBLIC_RATE_LIMIT) || 200, // 200 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP.'
  }
});

logger.info('Rate limiters initialized', {
  apiLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
  authLimit: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  passwordResetLimit: parseInt(process.env.PASSWORD_RESET_MAX) || 3
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  reportLimiter,
  publicLimiter
};
