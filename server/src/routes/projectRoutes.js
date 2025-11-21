/**
 * Project Routes
 * 
 * Defines routes for project management with authentication and validation.
 * 
 * @module routes/projectRoutes
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/authMiddleware');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats
} = require('../controllers/projectController');

const router = express.Router();

/**
 * Validation middleware for project creation
 */
const validateCreateProject = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Project name must be between 3 and 200 characters'),

  body('metalType')
    .trim()
    .notEmpty()
    .withMessage('Metal type is required')
    .isLength({ max: 100 })
    .withMessage('Metal type cannot exceed 100 characters'),

  body('processType')
    .trim()
    .notEmpty()
    .withMessage('Process type is required')
    .isLength({ max: 100 })
    .withMessage('Process type cannot exceed 100 characters'),

  body('circularityScore')
    .notEmpty()
    .withMessage('Circularity score is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Circularity score must be between 0 and 100'),

  body('gwp')
    .notEmpty()
    .withMessage('GWP (Global Warming Potential) is required')
    .isFloat({ min: 0 })
    .withMessage('GWP must be a positive number'),

  body('status')
    .optional()
    .isIn(['draft', 'in-progress', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, in-progress, completed, archived'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

/**
 * Validation middleware for project update
 */
const validateUpdateProject = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Project name must be between 3 and 200 characters'),

  body('metalType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Metal type cannot exceed 100 characters'),

  body('processType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Process type cannot exceed 100 characters'),

  body('circularityScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Circularity score must be between 0 and 100'),

  body('gwp')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('GWP must be a positive number'),

  body('status')
    .optional()
    .isIn(['draft', 'in-progress', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, in-progress, completed, archived'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

/**
 * Validation middleware for project ID parameter
 */
const validateProjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID')
];

/**
 * Validation middleware for query parameters
 */
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .matches(/^-?(name|metalType|processType|circularityScore|gwp|status|createdAt|lastModified)$/)
    .withMessage('Invalid sort field'),

  query('status')
    .optional()
    .isIn(['draft', 'in-progress', 'completed', 'archived'])
    .withMessage('Invalid status value'),

  query('metalType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Metal type filter too long'),

  query('processType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Process type filter too long'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];

/**
 * Validation error handler middleware
 */
const { handleValidationErrors } = require('../middleware/validators/commonValidators');

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @route   GET /api/projects/stats
 * @desc    Get project statistics for authenticated user
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  getProjectStats
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with pagination and filtering
 * @access  Private
 * @query   page, limit, metalType, processType, status, sort, search
 */
router.get(
  '/',
  authenticate,
  validateQueryParams,
  handleValidationErrors,
  getProjects
);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Authenticated users)
 */
router.post(
  '/',
  authenticate,
  validateCreateProject,
  handleValidationErrors,
  createProject
);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a single project by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateProjectId,
  handleValidationErrors,
  getProjectById
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Private (Owner or Admin)
 */
router.put(
  '/:id',
  authenticate,
  validateUpdateProject,
  handleValidationErrors,
  updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private (Owner or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  validateProjectId,
  handleValidationErrors,
  deleteProject
);

module.exports = router;
