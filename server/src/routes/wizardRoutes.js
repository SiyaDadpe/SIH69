/**
 * Wizard Routes
 * 
 * API endpoints for wizard workflow management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

const {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  updateStep,
  completeStep,
  submitWorkflow,
  saveDraftReport,
  deleteWorkflow,
  getUserWorkflows,
  getPublicWorkflows,
  getStatistics,
  generateAndSaveReport,
  generateStepPrediction
} = require('../controllers/wizardController');

// ============================================================================
// WORKFLOW ROUTES
// ============================================================================

/**
 * @route   GET /api/wizard/workflows/public
 * @desc    Get all public wizard workflows
 * @access  Public
 */
router.get('/workflows/public', getPublicWorkflows);

/**
 * @route   GET /api/wizard/statistics
 * @desc    Get wizard workflow statistics
 * @access  Public
 */
router.get('/statistics', getStatistics);

/**
 * @route   POST /api/wizard/workflows
 * @desc    Create new wizard workflow
 * @access  Private
 */
router.post('/workflows', authenticate, createWorkflow);

/**
 * @route   GET /api/wizard/workflows
 * @desc    Get all wizard workflows for authenticated user
 * @access  Private
 */
router.get('/workflows', authenticate, getWorkflows);

/**
 * @route   GET /api/wizard/workflows/:id
 * @desc    Get single wizard workflow by ID
 * @access  Private
 */
router.get('/workflows/:id', authenticate, getWorkflow);

/**
 * @route   PUT /api/wizard/workflows/:id
 * @desc    Update wizard workflow basic info
 * @access  Private
 */
router.put('/workflows/:id', authenticate, updateWorkflow);

/**
 * @route   DELETE /api/wizard/workflows/:id
 * @desc    Delete wizard workflow
 * @access  Private
 */
router.delete('/workflows/:id', authenticate, deleteWorkflow);

/**
 * @route   POST /api/wizard/workflows/:id/submit
 * @desc    Submit completed wizard workflow
 * @access  Private
 */
router.post('/workflows/:id/submit', authenticate, submitWorkflow);

/**
 * @route   POST /api/wizard/workflows/:id/save-draft
 * @desc    Save incomplete workflow and generate/update draft report
 * @access  Private
 */
router.post('/workflows/:id/save-draft', authenticate, saveDraftReport);

/**
 * @route   POST /api/wizard/workflows/:id/generate-report
 * @desc    Generate and save report from wizard workflow
 * @access  Private
 */
router.post('/workflows/:id/generate-report', authenticate, generateAndSaveReport);

// ============================================================================
// STEP ROUTES
// ============================================================================

/**
 * @route   PUT /api/wizard/workflows/:id/steps/:stepName
 * @desc    Update specific wizard step data
 * @access  Private
 * @params  stepName: mining|beneficiation|refining|smelting|manufacturing|recycling|valorization
 */
router.put('/workflows/:id/steps/:stepName', authenticate, updateStep);

/**
 * @route   POST /api/wizard/workflows/:id/steps/:stepName/complete
 * @desc    Mark a step as completed
 * @access  Private
 */
router.post('/workflows/:id/steps/:stepName/complete', authenticate, completeStep);

/**
 * @route   POST /api/wizard/workflows/:id/steps/:stepName/predict
 * @desc    Generate AI predictions for empty fields in a step
 * @access  Private
 * @params  stepName: mining|beneficiation|refining|smelting|manufacturing|recycling|valorization
 */
router.post('/workflows/:id/steps/:stepName/predict', authenticate, generateStepPrediction);

// ============================================================================
// USER ROUTES (Removed - no longer needed as all routes are user-specific)
// ============================================================================

module.exports = router;
