/**
 * Input Sanitization Middleware
 * 
 * Sanitizes user input to prevent XSS, NoSQL injection, and other security vulnerabilities.
 * Should be applied before validation middleware.
 */

const mongoSanitize = require('express-mongo-sanitize');
const { body, query, param } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Sanitize MongoDB queries to prevent NoSQL injection
 * Removes any keys that start with '$' or contain '.'
 */
const sanitizeMongoInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('MongoDB injection attempt detected', {
      ip: req.ip,
      key,
      path: req.path,
      method: req.method
    });
  }
});

/**
 * Basic XSS sanitization for string inputs
 * Use with express-validator for comprehensive protection
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Sanitize email input
 */
const sanitizeEmail = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().toLowerCase();
};

/**
 * Sanitize HTML content
 */
const sanitizeHTML = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Common sanitization rules
 */
const commonSanitizers = {
  string: [
    body('*').customSanitizer(sanitizeString),
    query('*').customSanitizer(sanitizeString),
    param('*').customSanitizer(sanitizeString)
  ],
  
  email: [
    body('email').customSanitizer(sanitizeEmail),
    query('email').customSanitizer(sanitizeEmail)
  ],
  
  // Trim whitespace from all string inputs
  trim: [
    body('*').if(body('*').isString()).trim(),
    query('*').if(query('*').isString()).trim()
  ]
};

/**
 * Middleware to log suspicious input patterns
 */
const detectSuspiciousInput = (req, res, next) => {
  const suspiciousPatterns = [
    /(\$where|\$regex|\$ne|\$gt|\$lt)/i, // MongoDB operators
    /<script|javascript:|onerror=/i, // XSS attempts
    /(union|select|insert|update|delete|drop|create|alter)\s/i, // SQL injection
    /\.\.\/|\.\.\\/, // Path traversal
    /%00/, // Null byte injection
  ];

  const checkInput = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            logger.warn('Suspicious input pattern detected', {
              ip: req.ip,
              path: req.path,
              method: req.method,
              field: currentPath,
              pattern: pattern.toString(),
              value: value.substring(0, 100) // Log first 100 chars
            });
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        checkInput(value, currentPath);
      }
    }
  };

  // Check request body, query, and params
  if (req.body) checkInput(req.body, 'body');
  if (req.query) checkInput(req.query, 'query');
  if (req.params) checkInput(req.params, 'params');

  next();
};

/**
 * Content Security Policy (CSP) headers
 * Prevents XSS attacks by controlling resource loading
 */
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // Remove 'unsafe-inline' in production
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

/**
 * Strict Content Security Policy for production
 * Remove 'unsafe-inline' and use nonces/hashes
 */
const strictContentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: []
  }
};

module.exports = {
  sanitizeMongoInput,
  sanitizeString,
  sanitizeEmail,
  sanitizeHTML,
  commonSanitizers,
  detectSuspiciousInput,
  contentSecurityPolicy,
  strictContentSecurityPolicy
};
