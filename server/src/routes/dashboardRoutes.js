/**
 * Dashboard Routes
 * 
 * Routes for dashboard data, insights, trends, and performance metrics.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUserInsights,
  getMonthlyTrends,
  getPerformanceSummary
} = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');
const { query, validationResult } = require('express-validator');

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
 * Validation rules for query parameters
 */
const validateInsightsQuery = [
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
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
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  handleValidationErrors
];

const validateTrendsQuery = [
  query('months')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Months must be between 1 and 24')
    .toInt(),
  handleValidationErrors
];

/**
 * Routes
 */

// @route   GET /api/dashboard
// @desc    Get comprehensive dashboard data with KPIs, recent projects, and insights
// @access  Private
router.get('/', authenticate, getDashboard);

// @route   GET /api/dashboard/insights
// @desc    Get user-specific insights with optional filtering
// @access  Private
router.get('/insights', authenticate, validateInsightsQuery, getUserInsights);

// @route   GET /api/dashboard/trends
// @desc    Get monthly trends for charts (circularity, GWP, project count)
// @access  Private
router.get('/trends', authenticate, validateTrendsQuery, getMonthlyTrends);

// @route   GET /api/dashboard/performance
// @desc    Get performance summary comparing current vs last month
// @access  Private
router.get('/performance', authenticate, getPerformanceSummary);

module.exports = router;
