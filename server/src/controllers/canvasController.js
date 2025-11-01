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
 * @desc    Generate comprehensive LCA report (Preview only)
 * @route   GET /api/canvas/workflows/:id/report
 * @access  Public (no authentication required)
 */
const generateWorkflowReport = asyncHandler(async (req, res) => {
  const workflow = await CanvasWorkflow.findById(req.params.id).populate('userId', 'name email');

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
 * @desc    Generate and save full Report document from Canvas workflow
 * @route   POST /api/canvas/workflows/:id/generate-report
 * @access  Public (no authentication required)
 */
const generateAndSaveReport = asyncHandler(async (req, res) => {
  const { Report } = require('../models');
  const workflow = await CanvasWorkflow.findById(req.params.id).populate('userId', 'name email');

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  // Generate LCA report data
  const lcaReport = generateLCAReport(workflow);

  // Build sections from workflow stages
  const sections = [];

  // Executive Summary Section
  sections.push({
    title: 'Executive Summary',
    order: 0,
    content: `This Life Cycle Assessment (LCA) report provides a comprehensive analysis of the ${workflow.metalType} workflow "${workflow.name}". The assessment covers ${lcaReport.summary.stageCount} active stages with ${lcaReport.summary.operationCount} total operations, evaluating environmental impacts across the entire value chain. The workflow achieved a circularity score of ${lcaReport.circularityScore.toFixed(2)}%, indicating ${lcaReport.environmentalRating} environmental performance.`,
    metrics: [
      {
        name: 'circularity_score',
        label: 'Circularity Score',
        value: parseFloat(lcaReport.circularityScore.toFixed(2)),
        unit: '%',
        timestamp: new Date()
      },
      {
        name: 'environmental_rating',
        label: 'Environmental Rating',
        value: lcaReport.environmentalRating,
        timestamp: new Date()
      }
    ]
  });

  // Environmental Impact Section
  sections.push({
    title: 'Environmental Impact Assessment',
    order: 1,
    content: `The workflow generated a total Global Warming Potential (GWP) of ${lcaReport.impacts.totalGWP.toFixed(2)} kg CO₂-eq, consumed ${lcaReport.impacts.totalWaterUsage.toFixed(2)} liters of water, generated ${lcaReport.impacts.totalWasteGenerated.toFixed(2)} kg of waste, and required ${lcaReport.impacts.totalEnergyRequired.toFixed(2)} kWh of energy. The average material recovery rate across all operations is ${lcaReport.impacts.averageRecoveryRate.toFixed(2)}%.`,
    metrics: [
      {
        name: 'gwp',
        label: 'Global Warming Potential',
        value: parseFloat(lcaReport.impacts.totalGWP.toFixed(2)),
        unit: 'kg CO₂-eq',
        baseline: 25,
        change: parseFloat(((lcaReport.impacts.totalGWP - 25) / 25 * 100).toFixed(2)),
        timestamp: new Date()
      },
      {
        name: 'water_usage',
        label: 'Water Usage',
        value: parseFloat(lcaReport.impacts.totalWaterUsage.toFixed(2)),
        unit: 'liters',
        timestamp: new Date()
      },
      {
        name: 'waste_generated',
        label: 'Waste Generated',
        value: parseFloat(lcaReport.impacts.totalWasteGenerated.toFixed(2)),
        unit: 'kg',
        timestamp: new Date()
      },
      {
        name: 'energy_required',
        label: 'Energy Required',
        value: parseFloat(lcaReport.impacts.totalEnergyRequired.toFixed(2)),
        unit: 'kWh',
        timestamp: new Date()
      },
      {
        name: 'recovery_rate',
        label: 'Average Recovery Rate',
        value: parseFloat(lcaReport.impacts.averageRecoveryRate.toFixed(2)),
        unit: '%',
        timestamp: new Date()
      }
    ]
  });

  // Stage-by-Stage Analysis Section
  if (lcaReport.stageCumulativeImpacts && lcaReport.stageCumulativeImpacts.length > 0) {
    const stageContent = lcaReport.stageCumulativeImpacts
      .map(stage => `**${stage.stageName}**: Operations: ${stage.operationCount}, GWP: ${stage.cumulativeGWP.toFixed(2)} kg CO₂-eq, Energy: ${stage.cumulativeEnergy.toFixed(2)} kWh`)
      .join('\n\n');

    sections.push({
      title: 'Stage-by-Stage Analysis',
      order: 2,
      content: `This section breaks down environmental impacts by process stage:\n\n${stageContent}`,
      metrics: lcaReport.stageCumulativeImpacts.map((stage, idx) => ({
        name: `stage_${idx + 1}_gwp`,
        label: `${stage.stageName} - GWP`,
        value: parseFloat(stage.cumulativeGWP.toFixed(2)),
        unit: 'kg CO₂-eq',
        timestamp: new Date()
      }))
    });
  }

  // Benchmark Comparison Section
  sections.push({
    title: 'Industry Benchmark Comparison',
    order: 3,
    content: `Compared to industry averages, this workflow shows a GWP difference of ${lcaReport.comparison.userVsIndustry.gwpDifference} kg CO₂-eq and a circularity score difference of ${lcaReport.comparison.userVsIndustry.circularityDifference}%. The workflow performs ${lcaReport.comparison.userVsIndustry.isAboveAverage ? 'above' : 'below'} the industry average for circularity.`,
    metrics: [
      {
        name: 'industry_avg_gwp',
        label: 'Industry Average GWP',
        value: lcaReport.comparison.industryAverage.gwp,
        unit: 'kg CO₂-eq',
        timestamp: new Date()
      },
      {
        name: 'industry_avg_circularity',
        label: 'Industry Average Circularity',
        value: lcaReport.comparison.industryAverage.circularityScore,
        unit: '%',
        timestamp: new Date()
      }
    ]
  });

  // Improvement Opportunities Section
  if (lcaReport.opportunities && lcaReport.opportunities.length > 0) {
    const opportunitiesText = lcaReport.opportunities
      .slice(0, 5)
      .map((opp, idx) => `${idx + 1}. **${opp.operation}**: ${opp.suggestion} (Priority: ${opp.priority})`)
      .join('\n\n');

    sections.push({
      title: 'Improvement Opportunities',
      order: 4,
      content: `Based on the analysis, the following improvement opportunities have been identified:\n\n${opportunitiesText}`,
      metrics: []
    });
  }

  // Operations Summary Section
  const allOperations = workflow.getAllOperations ? workflow.getAllOperations() : [];
  if (allOperations.length > 0) {
    const operationsText = allOperations
      .slice(0, 10)
      .map((op, idx) => `${idx + 1}. ${op.operationName} (${op.stageName}) - Quantity: ${op.quantity} ${op.unit}`)
      .join('\n');

    sections.push({
      title: 'Operations Summary',
      order: 5,
      content: `The workflow includes the following operations:\n\n${operationsText}${allOperations.length > 10 ? `\n\n...and ${allOperations.length - 10} more operations` : ''}`,
      metrics: []
    });
  }

  // Create Report document
  const reportData = {
    title: `LCA Report: ${workflow.name}`,
    description: `Life Cycle Assessment report generated from Canvas workflow for ${workflow.metalType}. ${workflow.description || ''}`,
    projectId: workflow._id, // Link to workflow as project reference
    author: {
      userId: workflow.userId?._id,
      name: workflow.userId?.name || 'System Generated',
      email: workflow.userId?.email || 'noreply@example.com'
    },
    status: workflow.status === 'complete' ? 'final' : 'draft',
    visibility: workflow.isPublic ? 'public' : 'private',
    sections: sections,
    circularityScore: parseFloat(lcaReport.circularityScore.toFixed(2)),
    co2Savings: parseFloat((lcaReport.impacts.totalGWP * 0.15).toFixed(2)), // Estimated CO2 savings
    tags: [
      'lca',
      'canvas-generated',
      workflow.metalType.toLowerCase(),
      `circularity-${Math.floor(lcaReport.circularityScore / 20) * 20}`, // Group by 20% ranges
      lcaReport.environmentalRating,
      ...( workflow.tags || [])
    ],
    metadata: {
      sourceType: 'canvas-workflow',
      workflowId: workflow._id.toString(),
      workflowName: workflow.name,
      metalType: workflow.metalType,
      generatedAt: new Date(),
      lcaData: {
        circularityScore: lcaReport.circularityScore,
        environmentalRating: lcaReport.environmentalRating,
        totalGWP: lcaReport.impacts.totalGWP,
        operationCount: lcaReport.summary.operationCount
      }
    }
  };

  const savedReport = await Report.create(reportData);

  console.log('[INFO]', 'Report generated from Canvas workflow', {
    workflowId: workflow._id,
    reportId: savedReport._id,
    circularityScore: lcaReport.circularityScore
  });

  res.status(201).json({
    success: true,
    message: 'Report generated and saved successfully from Canvas workflow',
    data: {
      report: savedReport,
      lcaPreview: lcaReport
    }
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
  generateAndSaveReport,
  updateWorkflow,
  deleteWorkflow,
  cloneWorkflow
};
