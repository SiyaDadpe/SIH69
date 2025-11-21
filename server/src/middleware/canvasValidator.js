/**
 * Canvas Validation Middleware
 * 
 * Validates canvas workflow operations and ensures data integrity
 */

const { query, body } = require('express-validator');
const { handleValidationErrors } = require('./validators/commonValidators');

/**
 * Validate workflow creation
 */
const validateWorkflowCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Workflow name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Workflow name must be between 3 and 200 characters'),
  
  body('metalType')
    .notEmpty()
    .withMessage('Metal type is required')
    .isIn(['Aluminium', 'Steel', 'Copper', 'Titanium', 'Lithium', 'Nickel', 'Gold', 'Zinc', 'Other'])
    .withMessage('Invalid metal type'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * Validate operation addition
 */
const validateOperationAddition = [
  body('stageNumber')
    .notEmpty()
    .withMessage('Stage number is required')
    .isInt({ min: 1, max: 7 })
    .withMessage('Stage number must be between 1 and 7'),
  
  body('operationId')
    .notEmpty()
    .withMessage('Operation ID is required')
    .isMongoId()
    .withMessage('Invalid operation ID format'),
  
  body('quantity')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Quantity must be greater than 0'),
  
  body('parameters')
    .optional()
    .isObject()
    .withMessage('Parameters must be an object'),
  
  handleValidationErrors
];

/**
 * Validate workflow update
 */
const validateWorkflowUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Workflow name must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  
  handleValidationErrors
];

/**
 * Validate operation filtering query
 */
const validateOperationFilters = [
  query('stage')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Stage must be between 1 and 7'),
  
  query('metalType')
    .optional()
    .isIn(['Aluminium', 'Steel', 'Copper', 'Titanium', 'Lithium', 'Nickel', 'Gold', 'Zinc', 'Universal', 'Other'])
    .withMessage('Invalid metal type'),
  
  query('category')
    .optional()
    .isIn(['Extraction', 'Processing', 'Refining', 'Smelting', 'Manufacturing', 'Recycling', 'Valorization', 'Waste Management'])
    .withMessage('Invalid category'),
  
  handleValidationErrors
];

/**
 * Validate workflow calculation request
 */
const validateCalculationRequest = [
  body('includeOptimizations')
    .optional()
    .isBoolean()
    .withMessage('includeOptimizations must be a boolean'),
  
  body('materialVolume')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Material volume must be greater than 0'),
  
  handleValidationErrors
];

/**
 * Validate clone request
 */
const validateCloneRequest = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Workflow name must be between 3 and 200 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateWorkflowCreation,
  validateOperationAddition,
  validateWorkflowUpdate,
  validateOperationFilters,
  validateCalculationRequest,
  validateCloneRequest
};
