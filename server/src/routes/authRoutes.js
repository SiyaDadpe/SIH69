/**
 * Authentication Routes
 * Routes for user registration, login, token refresh, and profile management
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/errorHandler');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('organization')
      .trim()
      .notEmpty()
      .withMessage('Organization is required')
      .isLength({ max: 200 })
      .withMessage('Organization name cannot exceed 200 characters'),
    validateRequest
  ],
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validateRequest
  ],
  login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
    validateRequest
  ],
  refreshToken
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PATCH /api/auth/me
 * @desc    Update user profile
 * @access  Private
 */
router.patch(
  '/me',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    validateRequest
  ],
  updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    validateRequest
  ],
  changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

module.exports = router;
