/**
 * JWT Utility Functions
 * Helper functions for JWT token generation and verification
 */

const jwt = require('jsonwebtoken');
const config = require('../config');


/**
 * Generate access token
 * @param {Object} user - User object from database
 * @returns {String} JWT access token
 */
exports.generateToken = (user) => {
  try {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return token;
  } catch (error) {
    console.error('[ERROR]', 'Error generating token', { error: error.message });
    throw new Error('Failed to generate token');
  }
};

/**
 * Generate refresh token
 * @param {Object} user - User object from database
 * @returns {String} JWT refresh token
 */
exports.generateRefreshToken = (user) => {
  try {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      type: 'refresh'
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || config.jwt.secret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return token;
  } catch (error) {
    console.error('[ERROR]', 'Error generating refresh token', { error: error.message });
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verify access token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('[WARN]', 'Token expired');
      return null;
    }
    if (error.name === 'JsonWebTokenError') {
      console.warn('[WARN]', 'Invalid token');
      return null;
    }
    console.error('[ERROR]', 'Error verifying token', { error: error.message });
    return null;
  }
};

/**
 * Verify refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
exports.verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || config.jwt.secret
    );
    
    // Check if it's actually a refresh token
    if (decoded.type !== 'refresh') {
      console.warn('[WARN]', 'Invalid token type - not a refresh token');
      return null;
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('[WARN]', 'Refresh token expired');
      return null;
    }
    if (error.name === 'JsonWebTokenError') {
      console.warn('[WARN]', 'Invalid refresh token');
      return null;
    }
    console.error('[ERROR]', 'Error verifying refresh token', { error: error.message });
    return null;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {String} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
exports.decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('[ERROR]', 'Error decoding token', { error: error.message });
    return null;
  }
};

/**
 * Verify JWT token (alias for verifyToken, used by authMiddleware)
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
exports.verifyJwt = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    console.error('[ERROR]', 'JWT verification failed', { error: error.message });
    throw error; // Throw error for authMiddleware to catch
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Extracted token or null
 */
exports.extractToken = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};
