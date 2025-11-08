/**
 * Wizard Routes
 * 
 * API endpoints for wizard workflow management
 */

const express = require('express');
const router = express.Router();

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
  generateAndSaveReport
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
 * @access  Public
 */
router.post('/workflows', createWorkflow);

/**
 * @route   GET /api/wizard/workflows
 * @desc    Get all wizard workflows with filtering
 * @access  Public
 */
router.get('/workflows', getWorkflows);

/**
 * @route   GET /api/wizard/workflows/:id
 * @desc    Get single wizard workflow by ID
 * @access  Public
 */
router.get('/workflows/:id', getWorkflow);

/**
 * @route   PUT /api/wizard/workflows/:id
 * @desc    Update wizard workflow basic info
 * @access  Public
 */
router.put('/workflows/:id', updateWorkflow);

/**
 * @route   DELETE /api/wizard/workflows/:id
 * @desc    Delete wizard workflow
 * @access  Public
 */
router.delete('/workflows/:id', deleteWorkflow);

/**
 * @route   POST /api/wizard/workflows/:id/submit
 * @desc    Submit completed wizard workflow
 * @access  Public
 */
router.post('/workflows/:id/submit', submitWorkflow);

/**
 * @route   POST /api/wizard/workflows/:id/save-draft
 * @desc    Save incomplete workflow and generate/update draft report
 * @access  Public
 */
router.post('/workflows/:id/save-draft', saveDraftReport);

/**
 * @route   POST /api/wizard/workflows/:id/generate-report
 * @desc    Generate and save report from wizard workflow
 * @access  Public
 */
router.post('/workflows/:id/generate-report', generateAndSaveReport);

// ============================================================================
// STEP ROUTES
// ============================================================================

/**
 * @route   PUT /api/wizard/workflows/:id/steps/:stepName
 * @desc    Update specific wizard step data
 * @access  Public
 * @params  stepName: mining|beneficiation|refining|smelting|manufacturing|recycling|valorization
 */
router.put('/workflows/:id/steps/:stepName', updateStep);

/**
 * @route   POST /api/wizard/workflows/:id/steps/:stepName/complete
 * @desc    Mark a step as completed
 * @access  Public
 */
router.post('/workflows/:id/steps/:stepName/complete', completeStep);

// ============================================================================
// USER ROUTES
// ============================================================================

/**
 * @route   GET /api/wizard/users/:userId/workflows
 * @desc    Get wizard workflows by user
 * @access  Public
 */
router.get('/users/:userId/workflows', getUserWorkflows);

module.exports = router;
