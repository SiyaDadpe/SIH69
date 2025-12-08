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
 * Logic For Filling Null values
 * This is wrt to frontend fields
 */
const getStepFieldDefinitions = () => {
  return {
    mining: [
      'applicableProcesses', 'others', 'location', 'year', 'oreGrade', 'overburdenRatio',
      'typeOfEquipment', 'waterUsage', 'redMudGeneration', 'biodiversityImpact',
      'mining_energy_MJ_per_t_ore', 'mining_co2_kg_per_t_ore', 'mining_sox_kg_per_t_ore',
      'mining_nox_kg_per_t_ore', 'mining_pm_kg_per_t_ore',
      'followingSustainableRules',
      'sustainabilityParameters.renewable_energy_percent',
      'sustainabilityParameters.water_recycling_rate',
      'sustainabilityParameters.biodiversity_offset_area_ha',
      'sustainabilityParameters.rehabilitation_progress_percent',
      'sustainabilityParameters.community_development_investment',
      'sustainabilityParameters.carbon_offset_tonnes'
    ],
    beneficiation: [
      'processes', 'processOthers', 'location', 'oreFeedRate', 'waterConsumption',
      'electricityUse', 'beneficiationEfficiency', 'crushingSelections', 'chemicalAgents',
      'chemicalOthers', 'tailings', 'tailingsOthers', 'noiseLevel', 'dustLevel',
      'beneficiation_water_m3_per_t_ore', 'beneficiation_electricity_kWh_per_t_ore',
      'beneficiation_tailings_management', 'beneficiation_noise_pollution', 'beneficiation_dust_pollution',
      'followingSustainableRules',
      'sustainabilityParameters.water_recycling_rate',
      'sustainabilityParameters.energy_from_renewables_percent',
      'sustainabilityParameters.tailings_dry_stacking',
      'sustainabilityParameters.chemical_recovery_rate',
      'sustainabilityParameters.dust_emission_control_efficiency'
    ],
    refining: [
      'processes', 'processOthers', 'variants', 'variantOthers', 'energyUse', 'waterUse',
      'redMudGen', 'causticSoda', 'limeAdditives', 'so2', 'nox', 'dust', 'toxicity', 'toxicityOthers',
      'refining_energy_MJ_per_t_alumina', 'refining_water_m3_per_t_alumina',
      'refining_red_mud_kg_per_t_alumina', 'refining_caustic_soda_kg_per_t_alumina',
      'refining_lime_kg_per_t_alumina', 'refining_so2_kg_per_t_alumina', 'refining_nox_kg_per_t_alumina',
      'refining_dust_kg_per_t_alumina',
      'followingSustainableRules',
      'sustainabilityParameters.renewable_energy_percent',
      'sustainabilityParameters.water_recycling_rate',
      'sustainabilityParameters.caustic_recovery_rate',
      'sustainabilityParameters.red_mud_utilization_percent',
      'sustainabilityParameters.emission_control_efficiency'
    ],
    smelting: [
      'processes', 'processOthers', 'variants', 'variantOthers', 'electricityDemand',
      'co2Emissions', 'cellTechnology', 'pfcEmissions', 'so2', 'nox', 'fluorideRecovery',
      'thermalRecovery',
      'smelting_energy_kWh_per_t_al', 'smelting_energy_MJ_per_t_al', 'smelting_co2_kg_per_t_al',
      'smelting_pfc_kg_per_t_al', 'smelting_so2_kg_per_t_al', 'smelting_nox_kg_per_t_al',
      'smelting_fluoride_recovery_percent', 'smelting_thermal_recovery_percent',
      'followingSustainableRules',
      'sustainabilityParameters.renewable_energy_percent',
      'sustainabilityParameters.inert_anode_technology',
      'sustainabilityParameters.pfc_capture_rate',
      'sustainabilityParameters.thermal_energy_recovery_percent',
      'sustainabilityParameters.fluoride_recycling_rate',
      'sustainabilityParameters.carbon_capture_rate'
    ],
    manufacturing: [
      'processes', 'processOthers', 'castingProcesses', 'scrapRate', 'recycledContent',
      'energyUsePerStep', 'fabricationEmissions', 'transportDistance', 'transportMode',
      'transportModeOthers', 'transportEmissionsPerTkm', 'lightweightingSectors',
      'lightweightingOthers', 'corrosionImpact', 'corrosionOthers',
      'manufacturing_energy_MJ_per_t_product', 'manufacturing_scrap_rate_percent',
      'manufacturing_recycled_content_percent', 'manufacturing_transport_emissions_kgCO2e_per_t',
      'followingSustainableRules',
      'sustainabilityParameters.renewable_energy_percent',
      'sustainabilityParameters.recycled_content_percent',
      'sustainabilityParameters.scrap_recovery_rate',
      'sustainabilityParameters.low_carbon_transport_percent',
      'sustainabilityParameters.design_for_recyclability',
      'sustainabilityParameters.product_lifetime_years'
    ],
    recycling: [
      'processes', 'processOthers', 'variants', 'variantOthers', 'scrapInputPercent',
      'collectionRatePercent', 'recyclingMethod', 'recoveryYieldPercent',
      'recyclingEfficiencyPercent', 'closedLoopPercent', 'openLoopPercent',
      'furnaceEnergyDemand', 'emissionSavings', 'sortingMethods', 'sortingOthers',
      'recycling_scrap_input_percent', 'recycling_recovery_yield_percent', 'recycling_energy_kWh_per_t_Al',
      'recycling_emission_savings_kgCO2e_per_t_Al', 'recycling_collection_rate_percent',
      'recycling_closed_loop_percent', 'recycling_open_loop_percent',
      'followingSustainableRules',
      'sustainabilityParameters.collection_efficiency_percent',
      'sustainabilityParameters.sorting_accuracy_percent',
      'sustainabilityParameters.energy_from_renewables_percent',
      'sustainabilityParameters.closed_loop_target_percent',
      'sustainabilityParameters.contamination_rate_percent'
    ],
    valorization: [
      'wasteTypes', 'wasteTypeOthers', 'wasteTypesOthers', 'valorizationMethods', 
      'valorizationMethodsOthers', 'methodsOthers', 'wasteUtilizationPercentages',
      'wasteUtilizationOverallPercent', 'emissionReductions', 'emissionReductionsPerTonne',
      'redMudUtilized', 'splUtilized', 'drossUtilized', 'fluorideUtilized', 'slagUtilized',
      'redMudRecovery', 'splRecovery', 'drossRecovery', 'fluorideRecovery', 'slagRecovery',
      'toxicityRedMud', 'toxicitySPL', 'toxicityDross', 'toxicityFluoride', 'toxicitySlag',
      'groundwaterRedMud', 'groundwaterSPL', 'groundwaterDross', 'groundwaterFluoride', 'groundwaterSlag',
      'econCementAdditive', 'econSoilStabilization', 'ironExtractionEconomicViability', 
      'econRareEarthExtraction', 'econSPLEncapsulation', 'econDrossRecovery', 'econFluorideCapture',
      'rareEarthExtractionEconomicViability', 'splEncapsulationEconomicViability',
      'drossRecoveryEconomicViability', 'fluorideCaptureEconomicViability',
      'drossRecoveryEfficiency', 'fluorideGasesRecoveryEfficiency',
      'valorization_recovery_efficiency_percent', 'valorization_emission_reduction_kgCO2e_per_t_waste',
      'followingSustainableRules',
      'sustainabilityParameters.waste_valorization_rate_percent',
      'sustainabilityParameters.emission_reduction_per_tonne',
      'sustainabilityParameters.circular_economy_integration',
      'sustainabilityParameters.zero_waste_target_progress_percent',
      'sustainabilityParameters.environmental_impact_reduction_percent'
    ]
  };
};

/**
 */
const smartMergeStepData = (stepName, existingData, inputData) => {
  const fieldDefinitions = getStepFieldDefinitions();
  const stepFields = fieldDefinitions[stepName] || [];
  
  // Start with existing data (if any)
  const mergedData = existingData ? { ...existingData } : {};
  
  // Update with input data (explicitly provided)
  Object.keys(inputData).forEach(key => {
    if (inputData[key] !== undefined) {
      mergedData[key] = inputData[key];
    }
  });
  
  // Ensure all top-level fields and nested objects exist
  stepFields.forEach(field => {
    // Handle nested fields (e.g., "sustainabilityParameters.renewable_energy_percent")
    if (field.includes('.')) {
      const [parentKey, childKey] = field.split('.');
      
      // Ensure parent object exists
      if (!(parentKey in mergedData)) {
        mergedData[parentKey] = {};
      }
      
      // Initialize child field to null if not present
      if (typeof mergedData[parentKey] === 'object' && mergedData[parentKey] !== null) {
        if (!(childKey in mergedData[parentKey])) {
          mergedData[parentKey][childKey] = null;
        }
      }
    } else {
      // Handle top-level fields
      if (!(field in mergedData)) {
        mergedData[field] = null;
      }
    }
  });
  
  // console.log(`[DEBUG] Smart merge for ${stepName}:`);
  // console.log(`- Existing fields: ${Object.keys(existingData || {}).length}`);
  // console.log(`- Input fields: ${Object.keys(inputData).length}`);
  // console.log(`- Final fields: ${Object.keys(mergedData).length}`);
  // console.log(`- Schema fields: ${stepFields.length}`);
  
  return mergedData;
};

/**
 * Checks if savied first time (for initial null population)
 */
const isFirstTimeSave = (existingData, inputData) => {
  // existing data
  if (!existingData || Object.keys(existingData).length === 0) {
    return true;
  }
  const hasNonNullValues = Object.values(existingData).some(value => 
    value !== null && value !== undefined && value !== ''
  );
  
  return !hasNonNullValues;
};


/**
 * Helper function to generate a comprehensive report from wizard workflow
 * @param {Object} workflow - The wizard workflow document
 * @param {Object} project - The associated project document
 * @returns {Promise<Object>} The created report document
 */
async function generateReportFromWizard(workflow, project) {
  const sections = [];
  
  // Populate workflow user details if not already populated
  if (!workflow.userId?.name) {
    await workflow.populate('userId', 'name email');
  }

  // Executive Summary
  const completedStepsCount = workflow.completedSteps?.length || 0;
  const circularityScore = workflow.calculatedResults?.circularityScore || 0;
  const totalGWP = workflow.calculatedResults?.totalGWP || 0;
  
  sections.push({
    title: 'Executive Summary',
    order: 0,
    content: `This Life Cycle Assessment (LCA) report was generated from a wizard workflow for ${workflow.metalType}. The assessment completed ${completedStepsCount} out of 7 process stages, achieving a circularity score of ${circularityScore.toFixed(2)}%. This report provides comprehensive insights into the environmental impacts across the entire value chain.`,
    metrics: [
      {
        name: 'circularity_score',
        label: 'Circularity Score',
        value: parseFloat(circularityScore.toFixed(2)),
        unit: '%',
        timestamp: new Date()
      },
      {
        name: 'completed_steps',
        label: 'Completed Process Stages',
        value: completedStepsCount,
        unit: 'stages',
        timestamp: new Date()
      }
    ]
  });

  // Environmental Impact Assessment
  sections.push({
    title: 'Environmental Impact Assessment',
    order: 1,
    content: `The workflow analysis shows a Global Warming Potential (GWP) of ${totalGWP.toFixed(2)} kg CO₂-eq, energy consumption of ${(workflow.calculatedResults?.energyConsumption || 0).toFixed(2)} kWh, water usage of ${(workflow.calculatedResults?.waterUsage || 0).toFixed(2)} liters, and waste generation of ${(workflow.calculatedResults?.wasteGenerated || 0).toFixed(2)} kg.`,
    metrics: [
      {
        name: 'gwp',
        label: 'Global Warming Potential',
        value: parseFloat(totalGWP.toFixed(2)),
        unit: 'kg CO₂-eq',
        timestamp: new Date()
      },
      {
        name: 'energy_consumption',
        label: 'Energy Consumption',
        value: parseFloat((workflow.calculatedResults?.energyConsumption || 0).toFixed(2)),
        unit: 'kWh',
        timestamp: new Date()
      },
      {
        name: 'water_usage',
        label: 'Water Usage',
        value: parseFloat((workflow.calculatedResults?.waterUsage || 0).toFixed(2)),
        unit: 'liters',
        timestamp: new Date()
      },
      {
        name: 'waste_generated',
        label: 'Waste Generated',
        value: parseFloat((workflow.calculatedResults?.wasteGenerated || 0).toFixed(2)),
        unit: 'kg',
        timestamp: new Date()
      }
    ]
  });

  // Process Stage Details
  const stageNames = ['Mining', 'Beneficiation', 'Refining', 'Smelting', 'Manufacturing', 'Recycling', 'Valorization'];
  const stageData = [
    workflow.mining,
    workflow.beneficiation,
    workflow.refining,
    workflow.smelting,
    workflow.manufacturing,
    workflow.recycling,
    workflow.valorization
  ];
  
  let stageContent = 'The following process stages were analyzed:\n\n';
  stageData.forEach((data, index) => {
    if (data && Object.keys(data).length > 0) {
      stageContent += `**${stageNames[index]}**: `;
      const dataPoints = Object.entries(data)
        .filter(([key, val]) => val !== null && val !== undefined && val !== '')
        .slice(0, 3)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
      stageContent += dataPoints || 'Configured';
      stageContent += '\n\n';
    }
  });

  sections.push({
    title: 'Process Stage Analysis',
    order: 2,
    content: stageContent,
    metrics: []
  });

  // CO2 Savings & Circularity Benefits
  const co2Saved = workflow.calculatedResults?.gwpSaved || workflow.calculatedResults?.co2Savings || 0;
  const recyclingRate = workflow.calculatedResults?.recyclingRate || 0;
  
  sections.push({
    title: 'Sustainability Benefits',
    order: 3,
    content: `This workflow demonstrates significant sustainability benefits with ${co2Saved.toFixed(2)} kg CO₂-eq saved through circular economy practices. The recycling rate achieved is ${recyclingRate.toFixed(2)}%, contributing to reduced environmental impact and resource conservation.`,
    metrics: [
      {
        name: 'co2_saved',
        label: 'CO₂ Emissions Saved',
        value: parseFloat(co2Saved.toFixed(2)),
        unit: 'kg CO₂-eq',
        timestamp: new Date()
      },
      {
        name: 'recycling_rate',
        label: 'Recycling Rate',
        value: parseFloat(recyclingRate.toFixed(2)),
        unit: '%',
        timestamp: new Date()
      }
    ]
  });

  // Create the report
  const reportData = {
    title: `LCA Report: ${workflow.name}`,
    description: workflow.description || `Life Cycle Assessment report generated from wizard workflow for ${workflow.metalType}`,
    projectId: project?._id,
    userId: workflow.userId?._id || workflow.userId, // Set userId
    author: {
      userId: workflow.userId?._id || workflow.userId,
      name: workflow.userId?.name || 'System Generated',
      email: workflow.userId?.email || 'noreply@example.com'
    },
    status: workflow.isCompleted ? 'final' : 'draft',
    visibility: workflow.isPublic ? 'public' : 'private',
    sections: sections,
    circularityScore: circularityScore,
    co2Savings: co2Saved,
    tags: [
      'wizard-generated',
      workflow.metalType?.toLowerCase() || 'metal',
      'lca',
      workflow.isCompleted ? 'completed' : 'in-progress',
      ...(workflow.tags || [])
    ],
    metadata: {
      sourceType: 'wizard-workflow',
      workflowId: workflow._id.toString(),
      projectId: project?._id?.toString(),
      metalType: workflow.metalType,
      generatedAt: new Date(),
      completionPercentage: workflow.completionPercentage || 0,
      completedSteps: workflow.completedSteps || []
    }
  };

  const report = await Report.create(reportData);
  return report;
}

/**
 * @desc    Create new wizard workflow
 * @route   POST /api/wizard/workflows
 * @access  Public
 */
const createWorkflow = asyncHandler(async (req, res) => {
  const { name, metalType, description } = req.body;

  if (!metalType) {
    return res.status(400).json({
      success: false,
      message: 'Metal type is required'
    });
  }

  // Use authenticated user's ID
  const userId = req.user._id;

  const workflow = await WizardWorkflow.createEmpty(userId, metalType, name);
  
  if (description) {
    workflow.description = description;
    await workflow.save();
  }

  console.log('[INFO] Wizard workflow created:', {
    workflowId: workflow._id,
    userId,
    metalType,
    userEmail: req.user.email
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
 * @desc    Get all wizard workflows for authenticated user
 * @route   GET /api/wizard/workflows
 * @access  Private
 */
const getWorkflows = asyncHandler(async (req, res) => {
  const {
    metalType,
    status,
    page = 1,
    limit = 10,
    sort = '-updatedAt'
  } = req.query;

  console.log('[DEBUG] getWorkflows called with params:', {
    metalType,
    status,
    page,
    limit,
    sort,
    userId: req.user._id,
    userEmail: req.user.email
  });

  // Filter by authenticated user's ID
  const query = {
    userId: req.user._id
  };

  if (metalType) {
    query.metalType = metalType;
  }

  if (status) {
    query.status = status;
  }

  console.log('[DEBUG] MongoDB query:', query);

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [workflows, total] = await Promise.all([
    WizardWorkflow.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email organization'),
    WizardWorkflow.countDocuments(query)
  ]);

  console.log('[DEBUG] Query results:', {
    workflowsFound: workflows.length,
    totalCount: total,
    workflowIds: workflows.map(w => w._id)
  });

  // Let's also check if there are ANY workflows for this user (without filters)
  const allUserWorkflows = await WizardWorkflow.countDocuments({ userId: req.user._id });
  console.log('[DEBUG] Total workflows for user (no filters):', allUserWorkflows);

  // Check all workflows in the system
  const totalSystemWorkflows = await WizardWorkflow.countDocuments({});
  console.log('[DEBUG] Total workflows in system:', totalSystemWorkflows);

  res.status(200).json({
    success: true,
    count: workflows.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: {
      workflows
    },
    debug: {
      allUserWorkflows,
      totalSystemWorkflows,
      query
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

  const workflow = await WizardWorkflow.findOne({
    _id: id,
    userId: req.user._id // Only find if belongs to user
  }).populate('userId', 'name email organization');

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

  const workflow = await WizardWorkflow.findOne({
    _id: id,
    userId: req.user._id // Only find if belongs to user
  });

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
    userId: req.user._id,
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

  // Debug logging
  console.log('='.repeat(80));
  console.log('[DEBUG] updateStep called');
  console.log('Workflow ID:', id);
  console.log('Step Name:', stepName);
  console.log('User ID:', req.user._id);
  console.log('Received Data:', JSON.stringify(stepData, null, 2));
  console.log('Data keys:', Object.keys(stepData));
  console.log('Data size:', Object.keys(stepData).length);
  console.log('='.repeat(80));

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  const validSteps = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
  const validCopperSteps = ['copperMining', 'copperBeneficiation', 'copperRefining', 'copperManufacturing', 'copperUsePhase', 'copperRecycling', 'copperValorization'];
  
  // Check if step is valid for aluminum or copper
  const isAluminumStep = validSteps.includes(stepName);
  const isCopperStep = validCopperSteps.includes(stepName);
  
  if (!isAluminumStep && !isCopperStep) {
    return res.status(400).json({
      success: false,
      message: `Invalid step name. Must be one of: ${validSteps.join(', ')} (aluminum) or ${validCopperSteps.join(', ')} (copper)`
    });
  }

  const workflow = await WizardWorkflow.findOne({
    _id: id,
    userId: req.user._id // Only find if belongs to user
  });

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  console.log('[DEBUG] Workflow found:', workflow._id);
  console.log('[DEBUG] Current step data before update:', JSON.stringify(workflow[stepName], null, 2));

  // Get existing data (convert from Mongoose object if needed)
  const existingData = workflow[stepName] ? 
    (workflow[stepName].toObject ? workflow[stepName].toObject() : workflow[stepName]) : 
    null;
  
  // Use smart merging to preserve existing values while setting unfilled fields to null
  const mergedData = smartMergeStepData(stepName, existingData, stepData);
  
  // Update the workflow with merged data
  workflow[stepName] = mergedData;
  
  // Mark the path as modified to ensure Mongoose saves the changes
  workflow.markModified(stepName);
  
  console.log('[DEBUG] Step data after smart merge:', JSON.stringify(workflow[stepName], null, 2));

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
    try {
      await workflow.markStepCompleted(stepNumbers[stepName]);
      console.log('[INFO] Step marked as completed');
    } catch (saveError) {
      console.error('[ERROR] Failed to mark step as completed:', saveError);
      throw saveError;
    }
  } else {
    try {
      await workflow.save();
      console.log('[INFO] Workflow saved without marking complete');
    } catch (saveError) {
      console.error('[ERROR] Failed to save workflow:', saveError);
      throw saveError;
    }
  }

  // Verify the save
  const updatedWorkflow = await WizardWorkflow.findById(id);
  console.log('[DEBUG] Verified saved data:', JSON.stringify(updatedWorkflow[stepName], null, 2));

  console.log('[INFO] Wizard step updated:', {
    workflowId: workflow._id,
    stepName,
    completed: workflow.completedSteps.includes(validSteps.indexOf(stepName)),
    fieldsSaved: Object.keys(updatedWorkflow[stepName] || {}).length
  });

  res.status(200).json({
    success: true,
    message: `Step '${stepName}' updated successfully`,
    data: {
      workflow: updatedWorkflow,
      completionPercentage: updatedWorkflow.completionPercentage,
      isCompleted: updatedWorkflow.isCompleted
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

  const workflow = await WizardWorkflow.findOne({
    _id: id,
    userId: req.user._id // Only find if belongs to user
  });

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

  const workflow = await WizardWorkflow.findOne({
    _id: id,
    userId: req.user._id // Only find if belongs to user
  });

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
      userId: workflow.userId, // Set userId
      owner: workflow.userId, // Keep owner for backward compatibility
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

    // Automatically generate a report from the completed wizard workflow
    try {
      const report = await generateReportFromWizard(workflow, project);
      console.log('[INFO] Report generated from wizard workflow:', {
        reportId: report._id,
        workflowId: workflow._id,
        projectId: project._id,
        status: report.status
      });
    } catch (reportError) {
      console.error('[ERROR] Failed to generate report from wizard workflow:', reportError);
      // Don't fail the submission if report generation fails
    }

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

  const workflow = await WizardWorkflow.findOne({
    _id: id,
    userId: req.user._id // Only find if belongs to user
  });

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  await workflow.deleteOne();

  console.log('[INFO] Wizard workflow deleted:', {
    workflowId: id,
    userId: req.user._id
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

/**
 * @desc    Save incomplete workflow and generate draft report
 * @route   POST /api/wizard/workflows/:id/save-draft
 * @access  Public
 */
const saveDraftReport = asyncHandler(async (req, res) => {
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

  // Check if workflow is incomplete
  if (workflow.isCompleted) {
    return res.status(400).json({
      success: false,
      message: 'Workflow is already completed. Use submit endpoint instead.',
      data: {
        completionPercentage: workflow.completionPercentage
      }
    });
  }

  // Create or find associated project
  let project = await Project.findOne({ wizardWorkflowId: workflow._id });
  
  if (!project) {
    project = await Project.create({
      name: workflow.name,
      description: workflow.description || `LCA Project for ${workflow.metalType} (In Progress)`,
      metalType: workflow.metalType,
      owner: workflow.userId,
      status: 'in-progress',
      circularityScore: workflow.calculatedResults?.circularityScore || 0,
      wizardWorkflowId: workflow._id,
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
  }

  // Check if draft report already exists for this workflow
  let report = await Report.findOne({ 
    'metadata.workflowId': workflow._id.toString(),
    status: 'draft'
  });

  if (report) {
    // Update existing draft report
    const updatedSections = await buildReportSections(workflow);
    report.sections = updatedSections;
    report.circularityScore = workflow.calculatedResults?.circularityScore || 0;
    report.co2Savings = workflow.calculatedResults?.gwpSaved || 0;
    report.metadata.completionPercentage = workflow.completionPercentage;
    report.metadata.completedSteps = workflow.completedSteps;
    report.updatedAt = new Date();
    await report.save();

    console.log('[INFO] Draft report updated:', {
      reportId: report._id,
      workflowId: workflow._id,
      completionPercentage: workflow.completionPercentage
    });
  } else {
    // Generate new draft report
    report = await generateReportFromWizard(workflow, project);
    
    console.log('[INFO] Draft report generated:', {
      reportId: report._id,
      workflowId: workflow._id,
      completionPercentage: workflow.completionPercentage,
      status: report.status
    });
  }

  res.status(200).json({
    success: true,
    message: 'Draft report saved successfully',
    data: {
      workflow,
      project,
      report,
      completionPercentage: workflow.completionPercentage
    }
  });
});

/**
 * Helper function to build report sections from workflow data
 */
async function buildReportSections(workflow) {
  const sections = [];
  const completedStepsCount = workflow.completedSteps?.length || 0;
  const circularityScore = workflow.calculatedResults?.circularityScore || 0;
  
  sections.push({
    title: 'Executive Summary',
    order: 0,
    content: `This is a draft LCA report for ${workflow.metalType}. Currently ${completedStepsCount} out of 7 stages have been completed (${workflow.completionPercentage}% complete). Preliminary circularity score: ${circularityScore.toFixed(2)}%.`,
    metrics: [
      {
        name: 'completion',
        label: 'Completion Progress',
        value: workflow.completionPercentage,
        unit: '%',
        timestamp: new Date()
      },
      {
        name: 'circularity_score',
        label: 'Preliminary Circularity Score',
        value: parseFloat(circularityScore.toFixed(2)),
        unit: '%',
        timestamp: new Date()
      }
    ]
  });

  return sections;
}

/**
 * @desc    Generate AI predictions for a workflow step
 * @route   POST /api/wizard/workflows/:id/steps/:stepName/predict
 * @access  Public
 */
const generateStepPrediction = asyncHandler(async (req, res) => {
  const { id, stepName } = req.params;
  const userData = req.body;

  // Import AI prediction service
  const { generatePredictions, validateRequiredFields } = require('../services/aiPredictionService');
  const { WizardWorkflowOutput } = require('../models');

  console.log(`[AI Prediction] Request received for workflow: ${id}, step: ${stepName}`);

  // Validate workflow ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  // Validate step name
  const validSteps = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
  if (!validSteps.includes(stepName)) {
    return res.status(400).json({
      success: false,
      message: `Invalid step name. Must be one of: ${validSteps.join(', ')}`
    });
  }

  // Find the workflow
  const workflow = await WizardWorkflow.findById(id);
  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Wizard workflow not found'
    });
  }

  // Validate required fields are present
  const validation = validateRequiredFields(stepName, userData);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.error,
      missingFields: validation.missingFields
    });
  }

  try {
    // Save user data to WizardWorkflow (same logic as Next button)
    console.log(`[AI Prediction] Saving user data to WizardWorkflow for step: ${stepName}`);
    
    // Get existing data (convert from Mongoose object if needed)
    const existingData = workflow[stepName] ? 
      (workflow[stepName].toObject ? workflow[stepName].toObject() : workflow[stepName]) : 
      null;
    
    // Use smart merging to preserve existing values while setting unfilled fields to null
    const mergedData = smartMergeStepData(stepName, existingData, userData);
    
    // Update the workflow with merged data
    workflow[stepName] = mergedData;
    
    // Mark the path as modified to ensure Mongoose saves the changes
    workflow.markModified(stepName);
    workflow.updatedAt = new Date();
    
    await workflow.save();

    console.log(`[AI Prediction] User data saved to WizardWorkflow successfully`);
    console.log(`[AI Prediction] ML model will process and create WizardWorkflowOutput in background`);

    // Return immediately with "processing" status
    // Frontend will poll WizardWorkflowOutput to check for predictions
    res.status(200).json({
      success: true,
      status: 'processing',
      message: 'User data saved. AI predictions are being generated by ML model. Please wait...',
      data: {
        workflowId: workflow._id,
        stepName: stepName
      }
    });

  } catch (error) {
    console.error(`[AI Prediction] Error:`, error);
    res.status(500).json({
      success: false,
      message: 'Error processing prediction request: ' + error.message
    });
  }
});

/**
 * @desc    Get AI predictions from WizardWorkflowOutput
 * @route   GET /api/wizard/workflows/:id/predictions
 * @access  Private
 */
const getPredictions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { WizardWorkflowOutput } = require('../models');

  console.log(`[Get Predictions] Request for workflow: ${id}`);

  // Validate workflow ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  try {
    // Find the workflow output (predictions)
    // Try multiple query strategies to handle different ML model implementations:
    // 1. workflowId field matches (correct way)
    // 2. _id matches (fallback if ML model created output with same _id as workflow)
    
    // Convert string ID to ObjectId for comparison
    const objectId = new mongoose.Types.ObjectId(id);
    
    const workflowOutput = await WizardWorkflowOutput.findOne({
      $or: [
        { workflowId: id },           // String format
        { workflowId: objectId },     // ObjectId format
        { _id: id },                  // String format (fallback)
        { _id: objectId }             // ObjectId format (fallback)
      ]
    });

    console.log(`[Get Predictions] Query: workflowId/id = ${id}`);
    console.log(`[Get Predictions] Found: ${workflowOutput ? 'YES' : 'NO'}`);
    
    if (workflowOutput) {
      console.log(`[Get Predictions] Output document _id: ${workflowOutput._id}`);
      console.log(`[Get Predictions] Output workflowId field: ${workflowOutput.workflowId}`);
      console.log(`[Get Predictions] Has mining data: ${workflowOutput.mining ? 'YES' : 'NO'}`);
      console.log(`[Get Predictions] Has beneficiation data: ${workflowOutput.beneficiation ? 'YES' : 'NO'}`);
      
      if (workflowOutput.mining?.aiPredictions) {
        console.log(`[Get Predictions] Mining aiPredictions keys:`, Object.keys(workflowOutput.mining.aiPredictions));
      }
    }

    if (!workflowOutput) {
      // No predictions yet - return empty
      return res.status(200).json({
        success: true,
        message: 'No predictions found for this workflow',
        data: {
          hasPredictions: false,
          predictions: {},
          predictionMetadata: null
        }
      });
    }

    // Extract predictions for each step
    const predictions = {
      mining: workflowOutput.mining || {},
      beneficiation: workflowOutput.beneficiation || {},
      refining: workflowOutput.refining || {},
      smelting: workflowOutput.smelting || {},
      manufacturing: workflowOutput.manufacturing || {},
      recycling: workflowOutput.recycling || {},
      valorization: workflowOutput.valorization || {}
    };

    console.log(`[Get Predictions] Found predictions for workflow ${id}`);

    res.status(200).json({
      success: true,
      message: 'Predictions retrieved successfully',
      data: {
        hasPredictions: true,
        predictions,
        predictionMetadata: workflowOutput.predictionMetadata,
        outputId: workflowOutput._id
      }
    });

  } catch (error) {
    console.error(`[Get Predictions] Error:`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving predictions: ' + error.message
    });
  }
});

module.exports = {
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
  generateStepPrediction,
  getPredictions
};
