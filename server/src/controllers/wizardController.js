/**
 * Wizard Controller
 * 
 * Handles wizard workflow operations: create, read, update, delete workflows,
 * manage step-by-step form data, and submit completed wizards.
 */

const asyncHandler = require('express-async-handler');
const { WizardWorkflow, User, Report, Project } = require('../models');
const mongoose = require('mongoose');
const { clearCache, clearAllCache } = require('../utils/localCache');

/**
 * @desc    Create new wizard workflow
 * @route   POST /api/wizard/workflows
 * @access  Public
 */
const createWorkflow = asyncHandler(async (req, res) => {
  const { name, metalType, userId, description } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  // Check if user exists
  const userExists = await User.findById(userId);
  if (!userExists) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const workflow = await WizardWorkflow.createEmpty(userId, metalType, name);
  
  if (description) {
    workflow.description = description;
    await workflow.save();
  }

  console.log('[INFO] Wizard workflow created:', {
    workflowId: workflow._id,
    userId,
    metalType
  });

  res.status(201).json({
    success: true,
    message: 'Wizard workflow created successfully',
    data: {
      workflow
    }
  });
});

/**
 * @desc    Get all wizard workflows with filtering
 * @route   GET /api/wizard/workflows
 * @access  Public
 */
const getWorkflows = asyncHandler(async (req, res) => {
  const {
    userId,
    metalType,
    status,
    isPublic,
    page = 1,
    limit = 10,
    sort = '-updatedAt'
  } = req.query;

  const query = {};

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    query.userId = userId;
  }

  if (metalType) {
    query.metalType = metalType;
  }

  if (status) {
    query.status = status;
  }

  if (isPublic !== undefined) {
    query.isPublic = isPublic === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [workflows, total] = await Promise.all([
    WizardWorkflow.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email'),
    WizardWorkflow.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: workflows.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: {
      workflows
    }
  });
});

/**
 * @desc    Get single wizard workflow by ID
 * @route   GET /api/wizard/workflows/:id
 * @access  Public
 */
const getWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  const workflow = await WizardWorkflow.findById(id).populate('userId', 'name email');

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      workflow
    }
  });
});

/**
 * @desc    Update wizard workflow basic info
 * @route   PUT /api/wizard/workflows/:id
 * @access  Public
 */
const updateWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, metalType, isPublic, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  const workflow = await WizardWorkflow.findById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  // Update allowed fields
  if (name !== undefined) workflow.name = name;
  if (description !== undefined) workflow.description = description;
  if (metalType !== undefined) workflow.metalType = metalType;
  if (isPublic !== undefined) workflow.isPublic = isPublic;
  if (status !== undefined) workflow.status = status;

  await workflow.save();

  console.log('[INFO] Wizard workflow updated:', {
    workflowId: workflow._id,
    updates: Object.keys(req.body)
  });

  res.status(200).json({
    success: true,
    message: 'Wizard workflow updated successfully',
    data: {
      workflow
    }
  });
});

/**
 * @desc    Update specific wizard step data
 * @route   PUT /api/wizard/workflows/:id/steps/:stepName
 * @access  Public
 */
const updateStep = asyncHandler(async (req, res) => {
  const { id, stepName } = req.params;
  const stepData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  const validSteps = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
  if (!validSteps.includes(stepName)) {
    return res.status(400).json({
      success: false,
      message: `Invalid step name. Must be one of: ${validSteps.join(', ')}`
    });
  }

  const workflow = await WizardWorkflow.findById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  // Update the step data
  workflow[stepName] = stepData;

  // Mark step as completed if markCompleted flag is true
  if (stepData.markCompleted === true) {
    const stepNumbers = {
      mining: 0,
      beneficiation: 1,
      refining: 2,
      smelting: 3,
      manufacturing: 4,
      recycling: 5,
      valorization: 6
    };
    await workflow.markStepCompleted(stepNumbers[stepName]);
  } else {
    await workflow.save();
  }

  console.log('[INFO] Wizard step updated:', {
    workflowId: workflow._id,
    stepName,
    completed: workflow.completedSteps.includes(validSteps.indexOf(stepName))
  });

  res.status(200).json({
    success: true,
    message: `Step '${stepName}' updated successfully`,
    data: {
      workflow,
      completionPercentage: workflow.completionPercentage,
      isCompleted: workflow.isCompleted
    }
  });
});

/**
 * @desc    Mark a step as completed
 * @route   POST /api/wizard/workflows/:id/steps/:stepName/complete
 * @access  Public
 */
const completeStep = asyncHandler(async (req, res) => {
  const { id, stepName } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  const validSteps = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
  if (!validSteps.includes(stepName)) {
    return res.status(400).json({
      success: false,
      message: `Invalid step name. Must be one of: ${validSteps.join(', ')}`
    });
  }

  const workflow = await WizardWorkflow.findById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  const stepNumbers = {
    mining: 0,
    beneficiation: 1,
    refining: 2,
    smelting: 3,
    manufacturing: 4,
    recycling: 5,
    valorization: 6
  };

  await workflow.markStepCompleted(stepNumbers[stepName]);

  console.log('[INFO] Step marked complete:', {
    workflowId: workflow._id,
    stepName,
    completionPercentage: workflow.completionPercentage
  });

  res.status(200).json({
    success: true,
    message: `Step '${stepName}' marked as completed`,
    data: {
      workflow,
      completionPercentage: workflow.completionPercentage,
      isCompleted: workflow.isCompleted,
      nextStep: workflow.currentStep
    }
  });
});

/**
 * @desc    Submit completed wizard workflow
 * @route   POST /api/wizard/workflows/:id/submit
 * @access  Public
 */
const submitWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  const workflow = await WizardWorkflow.findById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  if (!workflow.isCompleted) {
    return res.status(400).json({
      success: false,
      message: 'Cannot submit incomplete workflow. Please complete all 7 steps first.',
      data: {
        completionPercentage: workflow.completionPercentage,
        completedSteps: workflow.completedSteps,
        remainingSteps: [0, 1, 2, 3, 4, 5, 6].filter(s => !workflow.completedSteps.includes(s))
      }
    });
  }

  await workflow.submit();

  // Create a Project from the submitted wizard workflow
  try {
    const project = await Project.create({
      name: workflow.name,
      description: workflow.description || `LCA Project for ${workflow.metalType} created from wizard workflow`,
      metalType: workflow.metalType,
      owner: workflow.userId,
      status: 'completed',
      circularityScore: workflow.calculatedResults?.circularityScore || 0,
      gwp: workflow.calculatedResults?.totalGWP || 0,
      gwpSaved: workflow.calculatedResults?.gwpSaved || 0,
      co2Emissions: workflow.calculatedResults?.co2Emissions || 0,
      energyConsumption: workflow.calculatedResults?.energyConsumption || 0,
      waterUsage: workflow.calculatedResults?.waterUsage || 0,
      wasteGenerated: workflow.calculatedResults?.wasteGenerated || 0,
      recyclingRate: workflow.calculatedResults?.recyclingRate || 0,
      // Link to wizard workflow
      wizardWorkflowId: workflow._id,
      // Store detailed data from wizard steps
      metadata: {
        wizardData: {
          mining: workflow.mining,
          beneficiation: workflow.beneficiation,
          refining: workflow.refining,
          smelting: workflow.smelting,
          manufacturing: workflow.manufacturing,
          recycling: workflow.recycling,
          valorization: workflow.valorization
        }
      }
    });

    console.log('[INFO] Project created from wizard workflow:', {
      projectId: project._id,
      workflowId: workflow._id,
      userId: workflow.userId
    });

    // Clear dashboard cache so new project appears immediately
    clearCache(`dashboard:${workflow.userId}`);
    clearCache('dashboard:all');
    console.log('[INFO] Dashboard cache cleared for user:', workflow.userId);

  } catch (error) {
    console.error('[ERROR] Failed to create project from wizard workflow:', error);
    // Don't fail the submission if project creation fails
  }

  console.log('[INFO] Wizard workflow submitted:', {
    workflowId: workflow._id,
    userId: workflow.userId
  });

  res.status(200).json({
    success: true,
    message: 'Wizard workflow submitted successfully',
    data: {
      workflow
    }
  });
});

/**
 * @desc    Delete wizard workflow
 * @route   DELETE /api/wizard/workflows/:id
 * @access  Public
 */
const deleteWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  const workflow = await WizardWorkflow.findById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  await workflow.deleteOne();

  console.log('[INFO] Wizard workflow deleted:', {
    workflowId: id
  });

  res.status(200).json({
    success: true,
    message: 'Wizard workflow deleted successfully',
    data: {}
  });
});

/**
 * @desc    Get wizard workflows by user
 * @route   GET /api/wizard/users/:userId/workflows
 * @access  Public
 */
const getUserWorkflows = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, metalType } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  const options = {};
  if (status) options.status = status;
  if (metalType) options.metalType = metalType;

  const workflows = await WizardWorkflow.findByUser(userId, options);

  res.status(200).json({
    success: true,
    count: workflows.length,
    data: {
      workflows
    }
  });
});

/**
 * @desc    Get public wizard workflows
 * @route   GET /api/wizard/workflows/public
 * @access  Public
 */
const getPublicWorkflows = asyncHandler(async (req, res) => {
  const { metalType, tags } = req.query;

  const filters = {};
  if (metalType) filters.metalType = metalType;
  if (tags) filters.tags = tags.split(',');

  const workflows = await WizardWorkflow.getPublicWorkflows(filters);

  res.status(200).json({
    success: true,
    count: workflows.length,
    data: {
      workflows
    }
  });
});

/**
 * @desc    Get wizard statistics
 * @route   GET /api/wizard/statistics
 * @access  Public
 */
const getStatistics = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  const match = {};
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    match.userId = new mongoose.Types.ObjectId(userId);
  }

  const stats = await WizardWorkflow.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalWorkflows: { $sum: 1 },
        completedWorkflows: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        submittedWorkflows: {
          $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
        },
        draftWorkflows: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        avgCompletionPercentage: {
          $avg: {
            $multiply: [
              { $divide: [{ $size: '$completedSteps' }, 7] },
              100
            ]
          }
        }
      }
    }
  ]);

  const metalTypeStats = await WizardWorkflow.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$metalType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const result = stats[0] || {
    totalWorkflows: 0,
    completedWorkflows: 0,
    submittedWorkflows: 0,
    draftWorkflows: 0,
    avgCompletionPercentage: 0
  };

  res.status(200).json({
    success: true,
    data: {
      overall: result,
      byMetalType: metalTypeStats
    }
  });
});

/**
 * @desc    Generate and save report from wizard workflow
 * @route   POST /api/wizard/workflows/:id/generate-report
 * @access  Public
 */
const generateAndSaveReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  const workflow = await WizardWorkflow.findById(id).populate('userId', 'name email');

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  // Generate comprehensive report from wizard data
  const sections = [];

  // Section 1: Executive Summary
  const completionStatus = workflow.isCompleted ? 'completed' : `${workflow.completionPercentage}% complete`;
  sections.push({
    title: 'Executive Summary',
    order: 0,
    content: `This comprehensive Life Cycle Assessment (LCA) report is generated from a detailed wizard workflow for ${workflow.metalType} processing. The workflow is currently ${completionStatus} with ${workflow.completedSteps.length} out of 7 stages completed. This report provides insights into environmental impacts, resource consumption, and sustainability metrics across all lifecycle stages: mining, beneficiation, refining, smelting, manufacturing, recycling, and valorization.`,
    metrics: [
      {
        name: 'completion_percentage',
        label: 'Workflow Completion',
        value: workflow.completionPercentage,
        unit: '%',
        timestamp: new Date()
      },
      {
        name: 'completed_steps',
        label: 'Completed Steps',
        value: workflow.completedSteps.length,
        unit: 'steps',
        timestamp: new Date()
      }
    ]
  });

  // Section 2: Mining Stage Analysis
  if (workflow.mining && workflow.completedSteps.includes(0)) {
    const miningContent = [];
    
    if (workflow.mining.applicableProcesses && workflow.mining.applicableProcesses.length > 0) {
      miningContent.push(`**Processes**: ${workflow.mining.applicableProcesses.join(', ')}`);
    }
    if (workflow.mining.location) miningContent.push(`**Location**: ${workflow.mining.location}`);
    if (workflow.mining.oreGrade) miningContent.push(`**Ore Grade**: ${workflow.mining.oreGrade}%`);
    if (workflow.mining.productionVolume) miningContent.push(`**Production Volume**: ${workflow.mining.productionVolume} tonnes/year`);
    if (workflow.mining.equipmentType) miningContent.push(`**Equipment**: ${workflow.mining.equipmentType}`);
    if (workflow.mining.waterConsumption) miningContent.push(`**Water Consumption**: ${workflow.mining.waterConsumption} m³/tonne`);
    if (workflow.mining.biodiversityImpact) miningContent.push(`**Biodiversity Impact**: ${workflow.mining.biodiversityImpact}`);

    sections.push({
      title: 'Mining (Extraction) Stage',
      order: 1,
      content: `The mining operations involve ${workflow.mining.applicableProcesses ? workflow.mining.applicableProcesses.length : 0} key processes.\n\n${miningContent.join('\n')}`,
      metrics: [
        workflow.mining.oreGrade && {
          name: 'ore_grade',
          label: 'Ore Grade',
          value: workflow.mining.oreGrade,
          unit: '%',
          timestamp: new Date()
        },
        workflow.mining.productionVolume && {
          name: 'production_volume',
          label: 'Annual Production',
          value: workflow.mining.productionVolume,
          unit: 'tonnes/year',
          timestamp: new Date()
        },
        workflow.mining.waterConsumption && {
          name: 'water_consumption_mining',
          label: 'Water Consumption',
          value: workflow.mining.waterConsumption,
          unit: 'm³/tonne',
          timestamp: new Date()
        }
      ].filter(Boolean)
    });
  }

  // Section 3: Beneficiation Stage Analysis
  if (workflow.beneficiation && workflow.completedSteps.includes(1)) {
    const beneficiationContent = [];
    
    if (workflow.beneficiation.applicableProcesses && workflow.beneficiation.applicableProcesses.length > 0) {
      beneficiationContent.push(`**Processes**: ${workflow.beneficiation.applicableProcesses.join(', ')}`);
    }
    if (workflow.beneficiation.feedRate) beneficiationContent.push(`**Feed Rate**: ${workflow.beneficiation.feedRate} tonnes/hour`);
    if (workflow.beneficiation.beneficiationEfficiency) beneficiationContent.push(`**Efficiency**: ${workflow.beneficiation.beneficiationEfficiency}%`);
    if (workflow.beneficiation.waterConsumption) beneficiationContent.push(`**Water Use**: ${workflow.beneficiation.waterConsumption} m³/tonne`);
    if (workflow.beneficiation.electricityUse) beneficiationContent.push(`**Electricity**: ${workflow.beneficiation.electricityUse} kWh/tonne`);

    sections.push({
      title: 'Beneficiation (Processing) Stage',
      order: 2,
      content: `Ore processing and concentration operations.\n\n${beneficiationContent.join('\n')}`,
      metrics: [
        workflow.beneficiation.beneficiationEfficiency && {
          name: 'beneficiation_efficiency',
          label: 'Recovery Efficiency',
          value: workflow.beneficiation.beneficiationEfficiency,
          unit: '%',
          timestamp: new Date()
        },
        workflow.beneficiation.electricityUse && {
          name: 'electricity_beneficiation',
          label: 'Electricity Use',
          value: workflow.beneficiation.electricityUse,
          unit: 'kWh/tonne',
          timestamp: new Date()
        }
      ].filter(Boolean)
    });
  }

  // Section 4: Refining Stage Analysis
  if (workflow.refining && workflow.completedSteps.includes(2)) {
    const refiningContent = [];
    
    if (workflow.refining.applicableProcesses && workflow.refining.applicableProcesses.length > 0) {
      refiningContent.push(`**Processes**: ${workflow.refining.applicableProcesses.join(', ')}`);
    }
    if (workflow.refining.energyUse) refiningContent.push(`**Energy Use**: ${workflow.refining.energyUse} kWh/tonne`);
    if (workflow.refining.waterUse) refiningContent.push(`**Water Use**: ${workflow.refining.waterUse} m³/tonne`);
    if (workflow.refining.redMudGeneration) refiningContent.push(`**Red Mud Generated**: ${workflow.refining.redMudGeneration} kg/tonne`);
    if (workflow.refining.so2Emissions) refiningContent.push(`**SO₂ Emissions**: ${workflow.refining.so2Emissions} kg/tonne`);
    if (workflow.refining.noxEmissions) refiningContent.push(`**NOx Emissions**: ${workflow.refining.noxEmissions} kg/tonne`);

    sections.push({
      title: 'Refining (Bayer Process) Stage',
      order: 3,
      content: `Alumina refining operations and environmental impacts.\n\n${refiningContent.join('\n')}`,
      metrics: [
        workflow.refining.energyUse && {
          name: 'energy_refining',
          label: 'Energy Consumption',
          value: workflow.refining.energyUse,
          unit: 'kWh/tonne',
          timestamp: new Date()
        },
        workflow.refining.redMudGeneration && {
          name: 'red_mud',
          label: 'Red Mud Generation',
          value: workflow.refining.redMudGeneration,
          unit: 'kg/tonne',
          timestamp: new Date()
        }
      ].filter(Boolean)
    });
  }

  // Section 5: Smelting Stage Analysis
  if (workflow.smelting && workflow.completedSteps.includes(3)) {
    const smeltingContent = [];
    
    if (workflow.smelting.energySource) smeltingContent.push(`**Energy Source**: ${workflow.smelting.energySource}`);
    if (workflow.smelting.energyDemand) smeltingContent.push(`**Energy Demand**: ${workflow.smelting.energyDemand} kWh/tonne`);
    if (workflow.smelting.fluorideRecoveryEfficiency) smeltingContent.push(`**Fluoride Recovery**: ${workflow.smelting.fluorideRecoveryEfficiency}%`);
    if (workflow.smelting.thermalEnergyRecoveryPotential) smeltingContent.push(`**Thermal Recovery Potential**: ${workflow.smelting.thermalEnergyRecoveryPotential}%`);

    sections.push({
      title: 'Smelting (Hall-Héroult Process) Stage',
      order: 4,
      content: `Aluminium smelting using electrolysis.\n\n${smeltingContent.join('\n')}`,
      metrics: [
        workflow.smelting.energyDemand && {
          name: 'energy_smelting',
          label: 'Smelting Energy Demand',
          value: workflow.smelting.energyDemand,
          unit: 'kWh/tonne',
          timestamp: new Date()
        },
        workflow.smelting.fluorideRecoveryEfficiency && {
          name: 'fluoride_recovery',
          label: 'Fluoride Recovery',
          value: workflow.smelting.fluorideRecoveryEfficiency,
          unit: '%',
          timestamp: new Date()
        }
      ].filter(Boolean)
    });
  }

  // Section 6: Manufacturing Stage Analysis
  if (workflow.manufacturing && workflow.completedSteps.includes(4)) {
    const manufacturingContent = [];
    
    if (workflow.manufacturing.applicableProcesses && workflow.manufacturing.applicableProcesses.length > 0) {
      manufacturingContent.push(`**Processes**: ${workflow.manufacturing.applicableProcesses.join(', ')}`);
    }
    if (workflow.manufacturing.recycledContent) manufacturingContent.push(`**Recycled Content**: ${workflow.manufacturing.recycledContent}%`);
    if (workflow.manufacturing.scrapRate) manufacturingContent.push(`**Scrap Rate**: ${workflow.manufacturing.scrapRate}%`);
    if (workflow.manufacturing.energyUsePerProcessStep) manufacturingContent.push(`**Energy per Step**: ${workflow.manufacturing.energyUsePerProcessStep} kWh/tonne`);
    if (workflow.manufacturing.emissionsFromFabrication) manufacturingContent.push(`**Fabrication Emissions**: ${workflow.manufacturing.emissionsFromFabrication} kg CO₂e/tonne`);

    sections.push({
      title: 'Manufacturing (Fabrication) Stage',
      order: 5,
      content: `Product manufacturing and fabrication operations.\n\n${manufacturingContent.join('\n')}`,
      metrics: [
        workflow.manufacturing.recycledContent && {
          name: 'recycled_content',
          label: 'Recycled Content',
          value: workflow.manufacturing.recycledContent,
          unit: '%',
          timestamp: new Date()
        },
        workflow.manufacturing.emissionsFromFabrication && {
          name: 'fabrication_emissions',
          label: 'Fabrication Emissions',
          value: workflow.manufacturing.emissionsFromFabrication,
          unit: 'kg CO₂e/tonne',
          timestamp: new Date()
        }
      ].filter(Boolean)
    });
  }

  // Section 7: Recycling Stage Analysis
  if (workflow.recycling && workflow.completedSteps.includes(5)) {
    const recyclingContent = [];
    
    if (workflow.recycling.collectionRate) recyclingContent.push(`**Collection Rate**: ${workflow.recycling.collectionRate}%`);
    if (workflow.recycling.recoveryYield) recyclingContent.push(`**Recovery Yield**: ${workflow.recycling.recoveryYield}%`);
    if (workflow.recycling.furnaceEnergyDemand) recyclingContent.push(`**Furnace Energy**: ${workflow.recycling.furnaceEnergyDemand} kWh/tonne`);
    if (workflow.recycling.emissionSavings) recyclingContent.push(`**Emission Savings**: ${workflow.recycling.emissionSavings} kg CO₂e/tonne`);
    if (workflow.recycling.closedLoopRecyclingPercentage) recyclingContent.push(`**Closed-Loop**: ${workflow.recycling.closedLoopRecyclingPercentage}%`);

    sections.push({
      title: 'Recycling (End-of-Life) Stage',
      order: 6,
      content: `End-of-life material recovery and recycling operations.\n\n${recyclingContent.join('\n')}`,
      metrics: [
        workflow.recycling.recoveryYield && {
          name: 'recovery_yield',
          label: 'Material Recovery Yield',
          value: workflow.recycling.recoveryYield,
          unit: '%',
          timestamp: new Date()
        },
        workflow.recycling.emissionSavings && {
          name: 'emission_savings',
          label: 'CO₂ Savings from Recycling',
          value: workflow.recycling.emissionSavings,
          unit: 'kg CO₂e/tonne',
          timestamp: new Date()
        }
      ].filter(Boolean)
    });
  }

  // Section 8: Valorization Stage Analysis
  if (workflow.valorization && workflow.completedSteps.includes(6)) {
    const valorizationContent = [];
    
    if (workflow.valorization.wasteTypes && workflow.valorization.wasteTypes.length > 0) {
      valorizationContent.push(`**Waste Types**: ${workflow.valorization.wasteTypes.join(', ')}`);
    }
    if (workflow.valorization.valorizationMethods && workflow.valorization.valorizationMethods.length > 0) {
      valorizationContent.push(`**Valorization Methods**: ${workflow.valorization.valorizationMethods.join(', ')}`);
    }
    if (workflow.valorization.wasteUtilizationPercentages) valorizationContent.push(`**Waste Utilization**: ${workflow.valorization.wasteUtilizationPercentages}%`);
    if (workflow.valorization.emissionReductions) valorizationContent.push(`**Emission Reductions**: ${workflow.valorization.emissionReductions} kg CO₂e/tonne`);

    sections.push({
      title: 'Valorization (Waste Recovery) Stage',
      order: 7,
      content: `Byproduct and waste valorization for circular economy.\n\n${valorizationContent.join('\n')}`,
      metrics: [
        workflow.valorization.wasteUtilizationPercentages && {
          name: 'waste_utilization',
          label: 'Waste Utilization Rate',
          value: workflow.valorization.wasteUtilizationPercentages,
          unit: '%',
          timestamp: new Date()
        },
        workflow.valorization.emissionReductions && {
          name: 'valorization_emission_reduction',
          label: 'Emission Reductions',
          value: workflow.valorization.emissionReductions,
          unit: 'kg CO₂e/tonne',
          timestamp: new Date()
        }
      ].filter(Boolean)
    });
  }

  // Auto-generate tags
  const tags = ['lca', 'wizard-generated', workflow.metalType.toLowerCase()];
  if (workflow.isCompleted) tags.push('completed');
  if (workflow.tags) tags.push(...workflow.tags);

  // Create Report document
  const reportData = {
    title: `LCA Report: ${workflow.name}`,
    description: workflow.description || `Comprehensive LCA report generated from wizard workflow for ${workflow.metalType} processing`,
    author: {
      userId: workflow.userId._id,
      name: workflow.userId.name,
      email: workflow.userId.email
    },
    status: workflow.status === 'submitted' ? 'final' : 'draft',
    visibility: workflow.isPublic ? 'public' : 'private',
    sections: sections,
    tags: [...new Set(tags)],
    metadata: {
      sourceType: 'wizard-workflow',
      workflowId: workflow._id,
      workflowName: workflow.name,
      metalType: workflow.metalType,
      generatedAt: new Date(),
      wizardData: {
        completionPercentage: workflow.completionPercentage,
        completedSteps: workflow.completedSteps,
        isCompleted: workflow.isCompleted,
        status: workflow.status
      }
    }
  };

  const savedReport = await Report.create(reportData);

  console.log('[INFO] Report generated from wizard workflow:', {
    reportId: savedReport._id,
    workflowId: workflow._id,
    metalType: workflow.metalType,
    sections: sections.length
  });

  res.status(201).json({
    success: true,
    message: 'Report generated and saved successfully from wizard workflow',
    data: {
      report: savedReport,
      workflowSummary: {
        id: workflow._id,
        name: workflow.name,
        metalType: workflow.metalType,
        completionPercentage: workflow.completionPercentage,
        completedSteps: workflow.completedSteps
      }
    }
  });
});

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  updateStep,
  completeStep,
  submitWorkflow,
  deleteWorkflow,
  getUserWorkflows,
  getPublicWorkflows,
  getStatistics,
  generateAndSaveReport
};
