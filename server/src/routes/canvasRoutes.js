/**
 * Canvas Routes
 * 
 * Routes for canvas workflow management, operations, and LCA calculations.
 */

const express = require('express');
const router = express.Router();
const {
  getOperations,
  getOperation,
  getOperationsByStage,
  createWorkflow,
  getUserWorkflows,
  getWorkflow,
  addOperationToWorkflow,
  removeOperationFromWorkflow,
  updateOperationInWorkflow,
  calculateWorkflowImpact,
  generateWorkflowReport,
  generateAndSaveReport,
  updateWorkflow,
  deleteWorkflow,
  cloneWorkflow
} = require('../controllers/canvasController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateWorkflowCreation,
  validateOperationAddition,
  validateWorkflowUpdate,
  validateOperationFilters,
  validateCalculationRequest,
  validateCloneRequest
} = require('../middleware/canvasValidator');

/**
 * Operations Routes
 */

// Get all operations (with optional filters)
router.get('/operations', validateOperationFilters, getOperations);

// Get operations by stage
router.get('/operations/stage/:stage', getOperationsByStage);

// Get single operation
router.get('/operations/:id', getOperation);

/**
 * Workflow Routes - All protected with authentication
 */

// Create new workflow
router.post('/workflows', authenticate, validateWorkflowCreation, createWorkflow);

// Get all workflows for user
router.get('/workflows', authenticate, getUserWorkflows);

// Get single workflow
router.get('/workflows/:id', authenticate, getWorkflow);

// Add operation to workflow
router.post('/workflows/:id/operations', authenticate, validateOperationAddition, addOperationToWorkflow);

// Update operation in workflow
router.put('/workflows/:id/operations/:stageId/:operationIndex', authenticate, updateOperationInWorkflow);

// Remove operation from workflow
router.delete('/workflows/:id/operations/:stageId/:operationIndex', authenticate, removeOperationFromWorkflow);

// Calculate impact for workflow
router.post('/workflows/:id/calculate', authenticate, validateCalculationRequest, calculateWorkflowImpact);

// Generate report for workflow (preview only)
router.get('/workflows/:id/report', authenticate, generateWorkflowReport);

// Generate and save full Report document from workflow
router.post('/workflows/:id/generate-report', authenticate, generateAndSaveReport);

// Update workflow details
router.put('/workflows/:id', authenticate, validateWorkflowUpdate, updateWorkflow);

// Delete workflow
router.delete('/workflows/:id', authenticate, deleteWorkflow);

// Clone workflow
router.post('/workflows/:id/clone', authenticate, validateCloneRequest, cloneWorkflow);

module.exports = router;
