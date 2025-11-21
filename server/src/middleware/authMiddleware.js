/**
 * Authentication & Authorization Middleware
 * 
 * Provides middleware for protecting routes and checking user permissions.
 * 
 * @module middleware/authMiddleware
 */

const asyncHandler = require('express-async-handler');
const { verifyJwt } = require('../utils/jwtUtils');
const { User } = require('../models');


/**
 * Extract token from Authorization header
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} The extracted token or null
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  return token || null;
}

/**
 * Authentication Middleware
 * 
 * Verifies JWT token and attaches authenticated user to request object.
 * Fetches user from database and excludes password field.
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * router.get('/profile', authenticate, getProfile);
 */
const authenticate = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractToken(req);

    if (!token) {
      console.warn('[WARN]', 'Authentication failed - No token provided', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided. Please login to continue.'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (error) {
      console.warn('[WARN]', 'Authentication failed - Invalid token', {
        error: error.message,
        url: req.originalUrl,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    // Fetch user from database (exclude password)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.warn('[WARN]', 'Authentication failed - User not found', {
        userId: decoded.userId,
        url: req.originalUrl
      });

      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;

    console.log('[DEBUG]', 'User authenticated successfully', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    next();
  } catch (error) {
    console.error('[ERROR]', 'Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      url: req.originalUrl
    });

    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
});

/**
 * Check if user has required role
 * 
 * @param {Object} user - User object with role property
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean} True if user has required role
 */
function hasRequiredRole(user, allowedRoles) {
  if (!user || !user.role) {
    return false;
  }

  return allowedRoles.includes(user.role);
}

/**
 * Authorization Middleware Factory
 * 
 * Creates middleware that checks if authenticated user has required role(s).
 * Must be used after authenticate middleware.
 * 
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'manager')
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Single role
 * router.delete('/users/:id', authenticate, authorizeRoles('admin'), deleteUser);
 * 
 * @example
 * // Multiple roles
 * router.post('/projects', authenticate, authorizeRoles('engineer', 'manager'), createProject);
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        console.warn('[WARN]', 'Authorization failed - No authenticated user', {
          url: req.originalUrl,
          method: req.method
        });

        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please login to continue.'
        });
      }

      // Check if user has required role
      if (!hasRequiredRole(req.user, roles)) {
        console.warn('[WARN]', 'Authorization failed - Insufficient permissions', {
          userId: req.user._id,
          userRole: req.user.role,
          requiredRoles: roles,
          url: req.originalUrl,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: `Access forbidden. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`
        });
      }

      console.log('[DEBUG]', 'User authorized successfully', {
        userId: req.user._id,
        role: req.user.role,
        allowedRoles: roles
      });

      next();
    } catch (error) {
      console.error('[ERROR]', 'Authorization middleware error', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl
      });

      return res.status(500).json({
        success: false,
        message: 'Authorization check failed. Please try again.'
      });
    }
  };
}

/**
 * Optional Authentication Middleware
 * 
 * Attempts to authenticate user but doesn't fail if no token provided.
 * Useful for routes that have different behavior for authenticated users.
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Public route with optional auth
 * router.get('/projects', optionalAuth, getProjects);
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      // No token provided - continue without authentication
      return next();
    }

    // Try to verify token
    try {
      const decoded = verifyJwt(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user) {
        req.user = user;
        req.token = token;
        console.log('[DEBUG]', 'Optional auth - User authenticated', {
          userId: user._id
        });
      }
    } catch (error) {
      // Invalid token - continue without authentication
      console.log('[DEBUG]', 'Optional auth - Invalid token ignored', {
        error: error.message
      });
    }

    next();
  } catch (error) {
    console.error('[ERROR]', 'Optional auth middleware error', {
      error: error.message
    });
    next();
  }
});

/**
 * Check if user owns the resource
 * 
 * @param {string} resourceUserId - User ID of resource owner
 * @param {string} requestUserId - User ID from request
 * @returns {boolean} True if user owns the resource
 */
function isResourceOwner(resourceUserId, requestUserId) {
  if (!resourceUserId || !requestUserId) {
    return false;
  }

  return resourceUserId.toString() === requestUserId.toString();
}

/**
 * Authorization Middleware for Resource Ownership
 * 
 * Checks if authenticated user owns the resource or has admin role.
 * Resource owner ID must be in req.resource.owner or req.resource.userId.
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * router.put('/projects/:id', authenticate, loadProject, authorizeOwnership, updateProject);
 */
const authorizeOwnership = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Get resource owner ID from various possible locations
    const resourceOwnerId = 
      req.resource?.owner?._id || 
      req.resource?.owner || 
      req.resource?.userId ||
      req.project?.owner?._id ||
      req.project?.owner;

    if (!resourceOwnerId) {
      console.error('[ERROR]', 'Ownership check failed - Resource owner not found', {
        url: req.originalUrl
      });

      return res.status(500).json({
        success: false,
        message: 'Unable to verify resource ownership.'
      });
    }

    // Check if user is owner or admin
    const isOwner = isResourceOwner(resourceOwnerId, req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      console.warn('[WARN]', 'Authorization failed - Not resource owner', {
        userId: req.user._id,
        resourceOwnerId,
        url: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not own this resource.'
      });
    }

    console.log('[DEBUG]', 'Ownership verified', {
      userId: req.user._id,
      isOwner,
      isAdmin
    });

    next();
  } catch (error) {
    console.error('[ERROR]', 'Ownership middleware error', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: 'Ownership verification failed.'
    });
  }
};

/**
 * Subscription Check Middleware
 * 
 * Checks if user has required subscription tier.
 * 
 * @param {...string} tiers - Required subscription tiers
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.post('/advanced-analysis', authenticate, requireSubscription('pro', 'enterprise'), analyze);
 */
function requireSubscription(...tiers) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      if (!tiers.includes(req.user.subscription)) {
        console.warn('[WARN]', 'Subscription check failed', {
          userId: req.user._id,
          currentSubscription: req.user.subscription,
          requiredTiers: tiers
        });

        return res.status(403).json({
          success: false,
          message: `This feature requires ${tiers.join(' or ')} subscription. Your current subscription: ${req.user.subscription}.`,
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      console.error('[ERROR]', 'Subscription middleware error', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Subscription check failed.'
      });
    }
  };
}

// Export middleware and helper functions
module.exports = {
  authenticate,
  authorizeRoles,
  optionalAuth,
  authorizeOwnership,
  requireSubscription,
  // Export helpers for testing
  extractToken,
  hasRequiredRole,
  isResourceOwner
};
