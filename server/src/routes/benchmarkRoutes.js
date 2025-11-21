/**
 * Benchmark Routes
 * 
 * Routes for managing industry benchmark data.
 * Admin-only routes protected with authorizeRoles middleware.
 */

const express = require('express');
const router = express.Router();
const {
  getLatestBenchmark,
  getBenchmarkById,
  getAllBenchmarks,
  updateBenchmark,
  bulkUpdateBenchmarks,
  deleteBenchmark,
  getIndustryStats
} = require('../controllers/benchmarkController');
const {
  authenticate,
  authorizeRoles
} = require('../middleware/authMiddleware');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validators/commonValidators');

/**
 * Validation Rules
 */

// Update benchmark validation
const validateUpdateBenchmark = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('userAverageCircularity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('User average circularity must be between 0 and 100')
    .toFloat(),
  body('industryMedianCircularity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Industry median circularity must be between 0 and 100')
    .toFloat(),
  body('userPercentile')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('User percentile must be between 0 and 100')
    .toInt(),
  body('comparisonSectors')
    .optional()
    .isArray()
    .withMessage('Comparison sectors must be an array'),
  body('comparisonSectors.*')
    .optional()
    .isString()
    .withMessage('Each sector must be a string'),
  body('period')
    .optional()
    .isIn(['current', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Period must be one of: current, monthly, quarterly, yearly'),
  body('projectCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Project count must be a non-negative integer')
    .toInt(),
  handleValidationErrors
];

// Bulk update validation
const validateBulkUpdate = [
  body('benchmarks')
    .notEmpty()
    .withMessage('Benchmarks array is required')
    .isArray({ min: 1 })
    .withMessage('Benchmarks must be a non-empty array'),
  body('benchmarks.*.userId')
    .notEmpty()
    .withMessage('Each benchmark must have a userId')
    .isMongoId()
    .withMessage('Invalid user ID in benchmark'),
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
  query('period')
    .optional()
    .isIn(['current', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Period must be one of: current, monthly, quarterly, yearly'),
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
    .withMessage('Invalid benchmark ID'),
  handleValidationErrors
];

/**
 * Routes
 */

// @route   GET /api/benchmarks
// @desc    Get latest benchmark for authenticated user (or computed defaults)
// @access  Private
router.get(
  '/',
  authenticate,
  getLatestBenchmark
);

// @route   GET /api/benchmarks/all
// @desc    Get all benchmarks with pagination (Admin only)
// @access  Private/Admin (manager, policymaker)
router.get(
  '/all',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateGetAllQuery,
  getAllBenchmarks
);

// @route   GET /api/benchmarks/industry-stats
// @desc    Get industry-wide statistics (Admin only)
// @access  Private/Admin (manager, policymaker)
router.get(
  '/industry-stats',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  getIndustryStats
);

// @route   GET /api/benchmarks/:id
// @desc    Get benchmark by ID
// @access  Private
router.get(
  '/:id',
  authenticate,
  validateMongoId,
  getBenchmarkById
);

// @route   PUT /api/benchmarks
// @desc    Create or update benchmark (Admin only)
// @access  Private/Admin (manager, policymaker)
router.put(
  '/',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateUpdateBenchmark,
  updateBenchmark
);

// @route   POST /api/benchmarks/bulk-update
// @desc    Bulk update benchmarks from industry data (Admin only)
// @access  Private/Admin (manager, policymaker)
router.post(
  '/bulk-update',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateBulkUpdate,
  bulkUpdateBenchmarks
);

// @route   DELETE /api/benchmarks/:id
// @desc    Delete benchmark (Admin only)
// @access  Private/Admin (manager, policymaker)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'manager', 'policymaker'),
  validateMongoId,
  deleteBenchmark
);

module.exports = router;
