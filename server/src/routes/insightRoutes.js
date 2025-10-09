/**
 * Insight Routes
 * 
 * Routes for AI-generated insights and recommendations.
 * 
 * ⚠️ Note: /api/insights/generate-mock uses rule-based heuristics.
 * Production system will integrate with Python ML microservice.
 */

const express = require('express');
const router = express.Router();
const {
  getInsights,
  getInsightById,
  createInsight,
  generateMockInsights,
  deleteInsight
} = require('../controllers/insightController');
const {
  authenticate,
  authorizeRoles
} = require('../middleware/authMiddleware');
const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for handling validation errors
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

/**
 * Validation Rules
 */

// Get insights query validation
const validateGetInsightsQuery = [
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
  query('type')
    .optional()
    .isIn([
      'energy-efficiency',
      'material-optimization',
      'waste-reduction',
      'emission-hotspot',
      'benchmark-comparison',
      'regulatory-compliance',
      'cost-saving',
      'circular-opportunity'
    ])
    .withMessage('Invalid insight type'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  query('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID'),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  handleValidationErrors
];

// Create insight validation
const validateCreateInsight = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn([
      'energy-efficiency',
      'material-optimization',
      'waste-reduction',
      'emission-hotspot',
      'benchmark-comparison',
      'regulatory-compliance',
      'cost-saving',
      'circular-opportunity'
    ])
    .withMessage('Invalid insight type'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),
  body('confidenceScore')
    .notEmpty()
    .withMessage('Confidence score is required')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence score must be between 0 and 1')
    .toFloat(),
  body('relatedProjectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('action')
    .optional()
    .isObject()
    .withMessage('Action must be an object'),
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  handleValidationErrors
];

// Generate mock insights validation
const validateGenerateMock = [
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project ID'),
  handleValidationErrors
];

// Param ID validation
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid insight ID'),
  handleValidationErrors
];

/**
 * Routes
 */

// @route   GET /api/insights
// @desc    Get all insights with pagination and filtering
// @access  Private
router.get(
  '/',
  authenticate,
  validateGetInsightsQuery,
  getInsights
);

// @route   GET /api/insights/:id
// @desc    Get single insight by ID
// @access  Private
router.get(
  '/:id',
  authenticate,
  validateMongoId,
  getInsightById
);

// @route   POST /api/insights
// @desc    Create new insight (Admin only)
// @access  Private/Admin
router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  validateCreateInsight,
  createInsight
);

// @route   POST /api/insights/generate-mock
// @desc    Generate mock AI insights for a project (rule-based)
// @access  Private
// @note    ⚠️ MOCK IMPLEMENTATION - Replace with ML microservice in production
router.post(
  '/generate-mock',
  authenticate,
  validateGenerateMock,
  generateMockInsights
);

// @route   DELETE /api/insights/:id
// @desc    Delete insight (Admin only)
// @access  Private/Admin
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  validateMongoId,
  deleteInsight
);

module.exports = router;
