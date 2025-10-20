/**
 * Canvas Controller
 * 
 * Handles canvas workflow operations: create, read, update, delete workflows,
 * manage operations, calculate LCA impacts, and generate reports.
 */

const asyncHandler = require('express-async-handler');
const { Operation, CanvasWorkflow } = require('../models');
const {
  calculateTotalImpact,
  calculateCircularityScore,
  generateLCAReport
} = require('../utils/lcaCalculator');

/**
 * @desc    Get all available operations (optionally filtered)
 * @route   GET /api/canvas/operations
 * @access  Public
 */
const getOperations = asyncHandler(async (req, res) => {
  const { stage, metalType, category } = req.query;
  
  let query = { isActive: true };
  
  if (stage) {
    query.stage = stage;
  }
  
  if (metalType) {
    query.metalTypes = { $in: [metalType, 'universal'] };
  }
  
  if (category) {
    query.category = category;
  }

  const operations = await Operation.find(query).sort({ stage: 1, name: 1 });

  res.status(200).json({
    success: true,
    count: operations.length,
    data: operations
  });
});

/**
 * @desc    Get single operation by ID
 * @route   GET /api/canvas/operations/:id
 * @access  Public
 */
const getOperation = asyncHandler(async (req, res) => {
  const operation = await Operation.findById(req.params.id);

  if (!operation) {
    return res.status(404).json({
      success: false,
      message: 'Operation not found'
    });
  }

  res.status(200).json({
    success: true,
    data: operation
  });
});

/**
 * @desc    Get operations by stage and metal type
 * @route   GET /api/canvas/operations/stage/:stage
 * @access  Public
 */
const getOperationsByStage = asyncHandler(async (req, res) => {
  const { stage } = req.params;
  const { metalType } = req.query;

  const operations = await Operation.getByStage(stage, metalType);

  res.status(200).json({
    success: true,
    count: operations.length,
    data: operations
  });
});

/**
 * @desc    Create new canvas workflow
 * @route   POST /api/canvas/workflows
 * @access  Public (no authentication required)
 */
const createWorkflow = asyncHandler(async (req, res) => {
  const { name, description, metalType, userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required in request body'
    });
  }

  const workflow = await CanvasWorkflow.createEmpty(userId, metalType, name);

  if (description) {
    workflow.description = description;
    await workflow.save();
  }

  res.status(201).json({
    success: true,
    message: 'Workflow created successfully',
    data: workflow
  });
});

/**
 * @desc    Get all workflows for user
 * @route   GET /api/canvas/workflows
 * @access  Public (no authentication required)
 * Query params: userId, status
 */
const getUserWorkflows = asyncHandler(async (req, res) => {
  const { userId, status } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required as query parameter'
    });
  }

  const workflows = await CanvasWorkflow.getByUser(userId, status);

  res.status(200).json({
    success: true,
    count: workflows.length,
    data: workflows
  });
});

/**
 * @desc    Get single workflow
 * @route   GET /api/canvas/workflows/:id
 * @access  Public (no authentication required)
 */
const getWorkflow = asyncHandler(async (req, res) => {
  const workflow = await CanvasWorkflow.findById(req.params.id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  res.status(200).json({
    success: true,
    data: workflow
  });
});

/**
 * @desc    Add operation to workflow stage
 * @route   POST /api/canvas/workflows/:id/operations
 * @access  Public (no authentication required)
 */
const addOperationToWorkflow = asyncHandler(async (req, res) => {
  const { stageNumber, operationId, quantity = 1, unit = 'tons' } = req.body;

  let workflow = await CanvasWorkflow.findById(req.params.id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  // Convert stageNumber to stageId
  const stageMapping = {
    1: 'stage1-extraction',
    2: 'stage2-processing',
    3: 'stage3a-alumina-refining',
    4: 'stage4-smelting',
    5: 'stage5-manufacturing',
    6: 'stage6-recycling',
    7: 'stage7-valorization'
  };
  
  const stageId = stageMapping[stageNumber];

  // Get operation details
  const operation = await Operation.findById(operationId);

  if (!operation) {
    return res.status(404).json({
      success: false,
      message: 'Operation not found'
    });
  }

  // Validate metal type compatibility
  if (!operation.isApplicable(workflow.metalType)) {
    return res.status(400).json({
      success: false,
      message: `Operation not applicable for ${workflow.metalType}`
    });
  }

  // Add operation to workflow
  workflow.addOperation(stageId, operationId, operation.name, quantity, unit);
  
  // Update operation impact data
  const stage = workflow.stages.find(s => s.stageId === stageId);
  const lastOp = stage.operations[stage.operations.length - 1];
  lastOp.impactData = operation.getImpactData();
  lastOp.category = operation.category;

  await workflow.save();

  res.status(200).json({
    success: true,
    message: 'Operation added successfully',
    data: workflow
  });
});

/**
 * @desc    Remove operation from workflow
 * @route   DELETE /api/canvas/workflows/:id/operations/:stageId/:operationIndex
 * @access  Public (no authentication required)
 */
const removeOperationFromWorkflow = asyncHandler(async (req, res) => {
  const { id, stageId, operationIndex } = req.params;

  let workflow = await CanvasWorkflow.findById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  workflow.removeOperation(stageId, parseInt(operationIndex));
  await workflow.save();

  res.status(200).json({
    success: true,
    message: 'Operation removed successfully',
    data: workflow
  });
});

/**
 * @desc    Update operation quantity/parameters
 * @route   PUT /api/canvas/workflows/:id/operations/:stageId/:operationIndex
 * @access  Public (no authentication required)
 */
const updateOperationInWorkflow = asyncHandler(async (req, res) => {
  const { id, stageId, operationIndex } = req.params;
  const { quantity, unit } = req.body;

  let workflow = await CanvasWorkflow.findById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  const stage = workflow.stages.find(s => s.stageId === stageId);
  const operation = stage.operations[operationIndex];

  if (!operation) {
    return res.status(404).json({
      success: false,
      message: 'Operation not found'
    });
  }

  if (quantity !== undefined) operation.quantity = quantity;
  if (unit !== undefined) operation.unit = unit;

  await workflow.save();

  res.status(200).json({
    success: true,
    message: 'Operation updated successfully',
    data: workflow
  });
});

/**
 * @desc    Calculate LCA impact for workflow
 * @route   POST /api/canvas/workflows/:id/calculate
 * @access  Public (no authentication required)
 */
const calculateWorkflowImpact = asyncHandler(async (req, res) => {
  const workflow = await CanvasWorkflow.findById(req.params.id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  const allOperations = workflow.getAllOperations();

  if (allOperations.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No operations in workflow'
    });
  }

  // Calculate impacts
  const impactData = calculateTotalImpact(allOperations);
  const circularityScore = calculateCircularityScore(impactData, allOperations.length);

  // Update workflow with results
  workflow.results = {
    ...impactData,
    circularityScore,
    operationCount: allOperations.length,
    lastCalculated: new Date()
  };

  workflow.status = 'complete';
  await workflow.save();

  res.status(200).json({
    success: true,
    message: 'Impact calculated successfully',
    data: {
      workflow,
      results: workflow.results
    }
  });
});

/**
 * @desc    Generate comprehensive LCA report
 * @route   GET /api/canvas/workflows/:id/report
 * @access  Public (no authentication required)
 */
const generateWorkflowReport = asyncHandler(async (req, res) => {
  const workflow = await CanvasWorkflow.findById(req.params.id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  const report = generateLCAReport(workflow);

  res.status(200).json({
    success: true,
    data: report
  });
});

/**
 * @desc    Update workflow details
 * @route   PUT /api/canvas/workflows/:id
 * @access  Public (no authentication required)
 */
const updateWorkflow = asyncHandler(async (req, res) => {
  const { name, description, status, isPublic, tags } = req.body;

  let workflow = await CanvasWorkflow.findById(req.params.id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  if (name) workflow.name = name;
  if (description !== undefined) workflow.description = description;
  if (status) workflow.status = status;
  if (isPublic !== undefined) workflow.isPublic = isPublic;
  if (tags) workflow.tags = tags;

  await workflow.save();

  res.status(200).json({
    success: true,
    message: 'Workflow updated successfully',
    data: workflow
  });
});

/**
 * @desc    Delete workflow
 * @route   DELETE /api/canvas/workflows/:id
 * @access  Public (no authentication required)
 */
const deleteWorkflow = asyncHandler(async (req, res) => {
  const workflow = await CanvasWorkflow.findByIdAndDelete(req.params.id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Workflow deleted successfully'
  });
});

/**
 * @desc    Clone/duplicate a workflow
 * @route   POST /api/canvas/workflows/:id/clone
 * @access  Public (no authentication required)
 */
const cloneWorkflow = asyncHandler(async (req, res) => {
  const sourceWorkflow = await CanvasWorkflow.findById(req.params.id);

  if (!sourceWorkflow) {
    return res.status(404).json({
      success: false,
      message: 'Source workflow not found'
    });
  }

  const { userId, name } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required in request body'
    });
  }

  const newName = name || `${sourceWorkflow.name} (Copy)`;

  const clonedWorkflow = await CanvasWorkflow.create({
    name: newName,
    description: sourceWorkflow.description,
    userId,
    metalType: sourceWorkflow.metalType,
    stages: JSON.parse(JSON.stringify(sourceWorkflow.stages)), // Deep clone
    parentWorkflowId: sourceWorkflow._id,
    status: 'draft'
  });

  res.status(201).json({
    success: true,
    message: 'Workflow cloned successfully',
    data: clonedWorkflow
  });
});

module.exports = {
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
};
