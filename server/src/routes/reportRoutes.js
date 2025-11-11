/**
 * Report Routes
 * 
 * Defines all routes for report operations.
 * All routes are PUBLIC (no authentication required as per requirements).
 * 
 * @module routes/reportRoutes
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validators/commonValidators');
const { authenticate } = require('../middleware/authMiddleware');
const {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  publishReport,
  archiveReport,
  getReportStats,
  exportReport,
  bulkCreateReports,
  getReportsAnalytics,
  bulkExportReports
} = require('../controllers/reportController');

/**
 * @route   POST /api/reports/bulk-export
 * @desc    Bulk export reports as PDF or Excel bundle
 * @access  Private
 */
router.post(
  '/bulk-export',
  authenticate,
  body('reportIds').isArray({ min: 1, max: 100 }).withMessage('reportIds must be an array of 1-100 IDs'),
  body('format').isIn(['pdf', 'excel']).withMessage('Format must be pdf or excel'),
  handleValidationErrors,
  bulkExportReports
);
// Analytics/overview endpoint for dashboard
router.get('/analytics', authenticate, getReportsAnalytics);

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validation for creating a report
 */
const validateCreateReport = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  
  body('projectId')
    .optional()
    .isMongoId().withMessage('Invalid project ID format'),
  
  body('author.name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Author name must not exceed 100 characters'),
  
  body('author.email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  
  body('status')
    .optional()
    .isIn(['draft', 'final', 'archived']).withMessage('Status must be draft, final, or archived'),
  
  body('visibility')
    .optional()
    .isIn(['private', 'project', 'public']).withMessage('Visibility must be private, project, or public'),
  
  body('sections')
    .optional()
    .isArray().withMessage('Sections must be an array'),
  
  body('sections.*.title')
    .optional()
    .trim()
    .notEmpty().withMessage('Section title is required'),
  
  body('sections.*.order')
    .optional()
    .isInt({ min: 0 }).withMessage('Section order must be a non-negative integer'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Each tag must not exceed 50 characters')
];

/**
 * Validation for updating a report
 */
const validateUpdateReport = [
  param('id')
    .isMongoId().withMessage('Invalid report ID format'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  
  body('projectId')
    .optional()
    .isMongoId().withMessage('Invalid project ID format'),
  
  body('status')
    .optional()
    .isIn(['draft', 'final', 'archived']).withMessage('Status must be draft, final, or archived'),
  
  body('visibility')
    .optional()
    .isIn(['private', 'project', 'public']).withMessage('Visibility must be private, project, or public')
];

/**
 * Validation for report ID parameter
 */
const validateReportId = [
  param('id').isMongoId().withMessage('Invalid report ID format')
];

/**
 * Validation for query parameters
 */
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['draft', 'final', 'archived']).withMessage('Invalid status value'),
  
  query('visibility')
    .optional()
    .isIn(['private', 'project', 'public']).withMessage('Invalid visibility value'),
  
  query('projectId')
    .optional()
    .isMongoId().withMessage('Invalid project ID format'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Search query must be between 1 and 200 characters')
];

/**
 * Validation for bulk create
 */
const validateBulkCreate = [
  body('reports')
    .isArray({ min: 1, max: 100 }).withMessage('Reports must be an array with 1-100 items'),
  
  body('reports.*.title')
    .trim()
    .notEmpty().withMessage('Each report must have a title')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
];

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @route   GET /api/reports/stats
 * @desc    Get report statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  query('projectId').optional().isMongoId().withMessage('Invalid project ID format'),
  handleValidationErrors,
  getReportStats
);

/**
 * @route   POST /api/reports/bulk
 * @desc    Bulk create reports
 * @access  Private
 */
router.post(
  '/bulk',
  authenticate,
  validateBulkCreate,
  handleValidationErrors,
  bulkCreateReports
);

/**
 * @route   POST /api/reports
 * @desc    Create a new report
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validateCreateReport,
  handleValidationErrors,
  createReport
);

/**
 * @route   GET /api/reports
 * @desc    Get all reports for authenticated user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validateQueryParams,
  handleValidationErrors,
  getReports
);

/**
 * @route   GET /api/reports/:id
 * @desc    Get a single report by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateReportId,
  handleValidationErrors,
  getReportById
);

/**
 * @route   PATCH /api/reports/:id
 * @desc    Update a report
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  validateUpdateReport,
  handleValidationErrors,
  updateReport
);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete a report
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  validateReportId,
  handleValidationErrors,
  deleteReport
);

/**
 * @route   POST /api/reports/:id/publish
 * @desc    Publish a report (set status to final)
 * @access  Private
 */
router.post(
  '/:id/publish',
  authenticate,
  validateReportId,
  handleValidationErrors,
  publishReport
);

/**
 * @route   POST /api/reports/:id/archive
 * @desc    Archive a report
 * @access  Private
 */
router.post(
  '/:id/archive',
  authenticate,
  validateReportId,
  handleValidationErrors,
  archiveReport
);

/**
 * @route   GET /api/reports/:id/export
 * @desc    Export a report (JSON or PDF)
 * @access  Private
 */
router.get(
  '/:id/export',
  authenticate,
  validateReportId,
  query('format').optional().isIn(['json', 'pdf']).withMessage('Format must be json or pdf'),
  handleValidationErrors,
  exportReport
);

module.exports = router;
