/**
 * System Status Routes
 * 
 * Routes for managing system-wide status and health information.
 * Admin-only routes protected with authorizeRoles middleware.
 */

const express = require('express');
const router = express.Router();
const {
  getSystemStatus,
  getSystemStatusById,
  getAllSystemStatus,
  updateSystemStatus,
  addFeature,
  addAlert,
  resolveAlert,
  deleteSystemStatus,
  getHealthSummary
} = require('../controllers/systemStatusController');
const {
  authenticate,
  authorizeRoles
} = require('../middleware/authMiddleware');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validators/commonValidators');

/**
 * Validation Rules
 */

// Update system status validation
const validateUpdateSystemStatus = [
  body('dataLastUpdated')
    .optional()
    .isISO8601()
    .withMessage('Data last updated must be a valid ISO 8601 date'),
  body('newFeatures')
    .optional()
    .isArray()
    .withMessage('New features must be an array'),
  body('maintenanceSchedule')
    .optional(),
  body('apiStatus')
    .optional()
    .isIn(['operational', 'degraded', 'maintenance', 'outage'])
    .withMessage('API status must be one of: operational, degraded, maintenance, outage'),
  body('serviceHealth')
    .optional()
    .isObject()
    .withMessage('Service health must be an object'),
  body('serviceHealth.database')
    .optional()
    .isIn(['healthy', 'degraded', 'down'])
    .withMessage('Database health must be one of: healthy, degraded, down'),
  body('serviceHealth.api')
    .optional()
    .isIn(['healthy', 'degraded', 'down'])
    .withMessage('API health must be one of: healthy, degraded, down'),
  body('serviceHealth.authentication')
    .optional()
    .isIn(['healthy', 'degraded', 'down'])
    .withMessage('Authentication health must be one of: healthy, degraded, down'),
  body('metrics')
    .optional()
    .isObject()
    .withMessage('Metrics must be an object'),
  body('alerts')
    .optional()
    .isArray()
    .withMessage('Alerts must be an array'),
  handleValidationErrors
];

// Add feature validation
const validateAddFeature = [
  body('name')
    .notEmpty()
    .withMessage('Feature name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Feature name must be between 3 and 100 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
    .trim(),
  body('releaseDate')
    .optional()
    .isISO8601()
    .withMessage('Release date must be a valid ISO 8601 date'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .trim(),
  handleValidationErrors
];

// Add alert validation
const validateAddAlert = [
  body('severity')
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(['info', 'warning', 'error', 'critical'])
    .withMessage('Severity must be one of: info, warning, error, critical'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters')
    .trim(),
  body('affectedServices')
    .optional()
    .isArray()
    .withMessage('Affected services must be an array'),
  body('affectedServices.*')
    .optional()
    .isString()
    .withMessage('Each affected service must be a string'),
  body('resolvedAt')
    .optional()
    .isISO8601()
    .withMessage('Resolved at must be a valid ISO 8601 date'),
  handleValidationErrors
];

// Query validation
const validateGetAllQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  handleValidationErrors
];

// Param ID validation
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid system status ID'),
  handleValidationErrors
];

const validateAlertId = [
  param('alertId')
    .isMongoId()
    .withMessage('Invalid alert ID'),
  handleValidationErrors
];

/**
 * Routes
 */

// @route   GET /api/system-status
// @desc    Get current system status (or default)
// @access  Private
router.get(
  '/',
  authenticate,
  getSystemStatus
);

// @route   GET /api/system-status/health
// @desc    Get system health summary (Admin only)
// @access  Private/Admin (manager, policymaker)
router.get(
  '/health',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  getHealthSummary
);

// @route   GET /api/system-status/all
// @desc    Get all system status records (Admin only)
// @access  Private/Admin (manager, policymaker)
router.get(
  '/all',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateGetAllQuery,
  getAllSystemStatus
);

// @route   GET /api/system-status/:id
// @desc    Get system status by ID (Admin only)
// @access  Private/Admin (manager, policymaker)
router.get(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateMongoId,
  getSystemStatusById
);

// @route   PUT /api/system-status
// @desc    Update system status (Admin only)
// @access  Private/Admin (manager, policymaker)
router.put(
  '/',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateUpdateSystemStatus,
  updateSystemStatus
);

// @route   POST /api/system-status/features
// @desc    Add new feature announcement (Admin only)
// @access  Private/Admin (manager, policymaker)
router.post(
  '/features',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateAddFeature,
  addFeature
);

// @route   POST /api/system-status/alerts
// @desc    Add system alert (Admin only)
// @access  Private/Admin (manager, policymaker)
router.post(
  '/alerts',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateAddAlert,
  addAlert
);

// @route   PATCH /api/system-status/alerts/:alertId/resolve
// @desc    Resolve system alert (Admin only)
// @access  Private/Admin (manager, policymaker)
router.patch(
  '/alerts/:alertId/resolve',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateAlertId,
  resolveAlert
);

// @route   DELETE /api/system-status/:id
// @desc    Delete system status record (Admin only)
// @access  Private/Admin (manager, policymaker)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateMongoId,
  deleteSystemStatus
);

module.exports = router;
