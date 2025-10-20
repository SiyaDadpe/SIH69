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
 * Workflow Routes
 */

// Create new workflow
router.post('/workflows', validateWorkflowCreation, createWorkflow);

// Get all workflows for user
router.get('/workflows', getUserWorkflows);

// Get single workflow
router.get('/workflows/:id', getWorkflow);

// Add operation to workflow
router.post('/workflows/:id/operations', validateOperationAddition, addOperationToWorkflow);

// Update operation in workflow
router.put('/workflows/:id/operations/:stageId/:operationIndex', updateOperationInWorkflow);

// Remove operation from workflow
router.delete('/workflows/:id/operations/:stageId/:operationIndex', removeOperationFromWorkflow);

// Calculate impact for workflow
router.post('/workflows/:id/calculate', validateCalculationRequest, calculateWorkflowImpact);

// Generate report for workflow
router.get('/workflows/:id/report', generateWorkflowReport);

// Update workflow details
router.put('/workflows/:id', validateWorkflowUpdate, updateWorkflow);

// Delete workflow
router.delete('/workflows/:id', deleteWorkflow);

// Clone workflow
router.post('/workflows/:id/clone', validateCloneRequest, cloneWorkflow);

module.exports = router;
