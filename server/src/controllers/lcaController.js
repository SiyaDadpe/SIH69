/**
 * LCA Controller
 * 
 * Handles Life Cycle Assessment calculations and report generation
 * for wizard workflows.
 * 
 * @module controllers/lcaController
 */

const asyncHandler = require('express-async-handler');
const path = require('path');
const CalculateLCA = require('../models/CalculateLCA');
const WizardWorkflow = require('../models/WizardWorkflow');
const { generateLCAReport, generateFilename } = require('../utils/generateLCAReport');

/**
 * Stage-specific LCA calculation coefficients
 * Based on aluminum production industry standards
 */
const STAGE_COEFFICIENTS = {
  mining: {
    energyFactor: 0.5,      // MJ per ton ore
    co2Factor: 0.12,        // kg CO2e per ton ore
    waterFactor: 0.8,       // m³ per ton ore
    wasteFactor: 0.15,      // waste percentage
    airQualityFactor: 0.02  // kg pollutants per ton ore
  },
  beneficiation: {
    energyFactor: 1.2,
    co2Factor: 0.28,
    waterFactor: 1.5,
    wasteFactor: 0.25,
    airQualityFactor: 0.05
  },
  refining: {
    energyFactor: 12.5,     // Bayer process is energy intensive
    co2Factor: 2.8,
    waterFactor: 3.2,
    wasteFactor: 0.45,      // Red mud generation
    airQualityFactor: 0.18
  },
  smelting: {
    energyFactor: 45.0,     // Hall-Héroult process (most energy-intensive)
    co2Factor: 11.5,
    waterFactor: 0.5,
    wasteFactor: 0.08,
    airQualityFactor: 0.35
  },
  manufacturing: {
    energyFactor: 8.5,
    co2Factor: 1.8,
    waterFactor: 1.2,
    wasteFactor: 0.12,
    airQualityFactor: 0.08
  },
  recycling: {
    energyFactor: 2.8,      // Recycling is more efficient
    co2Factor: 0.65,
    waterFactor: 0.4,
    wasteFactor: 0.10,
    airQualityFactor: 0.03
  },
  valorization: {
    energyFactor: 1.5,
    co2Factor: 0.35,
    waterFactor: 0.6,
    wasteFactor: 0.05,      // Waste valorization reduces waste
    airQualityFactor: 0.02
  }
};

/**
 * Calculate stage impact metrics
 * @param {string} stageName - Stage name
 * @param {Object} stageData - Stage form data
 * @returns {Object} Stage impact metrics
 */
function calculateStageImpact(stageName, stageData) {
  const coeffs = STAGE_COEFFICIENTS[stageName] || STAGE_COEFFICIENTS.manufacturing;
  
  // Base production amount (default 1000 kg aluminum)
  const productionAmount = stageData.production_amount || 1000;
  
  // Calculate base impacts
  let energyConsumption = productionAmount * coeffs.energyFactor;
  let co2Emissions = productionAmount * coeffs.co2Factor;
  let waterUsage = productionAmount * coeffs.waterFactor;
  let wasteGeneration = productionAmount * coeffs.wasteFactor;
  let airQualityImpact = productionAmount * coeffs.airQualityFactor;

  // Apply stage-specific modifiers based on actual data
  switch (stageName) {
    case 'mining':
      // Ore grade affects efficiency
      if (stageData.mining_ore_grade_percent) {
        const gradeMultiplier = 1 / Math.max(0.1, stageData.mining_ore_grade_percent / 100);
        energyConsumption *= gradeMultiplier;
        co2Emissions *= gradeMultiplier;
      }
      // Mining method affects impact
      if (stageData.mining_method === 'underground') {
        energyConsumption *= 1.3;
        co2Emissions *= 1.2;
      }
      break;

    case 'beneficiation':
      // Ore feed rate affects scale
      if (stageData.ore_feed_rate) {
        const rateMultiplier = stageData.ore_feed_rate / 1000;
        energyConsumption *= rateMultiplier;
        waterUsage *= rateMultiplier;
      }
      break;

    case 'refining':
      // Energy and water use from form data
      if (stageData.energy_use) {
        energyConsumption = stageData.energy_use;
      }
      if (stageData.water_use) {
        waterUsage = stageData.water_use;
      }
      // Red mud generation
      if (stageData.red_mud_generation) {
        wasteGeneration += stageData.red_mud_generation;
      }
      break;

    case 'smelting':
      // Electricity demand (Hall-Héroult)
      if (stageData.electricity_demand) {
        energyConsumption = stageData.electricity_demand;
        // CO2 depends on electricity source
        const renewablePercent = stageData.renewable_energy_percent || 0;
        co2Emissions *= (1 - renewablePercent / 100 * 0.7);
      }
      if (stageData.co2_emissions) {
        co2Emissions = stageData.co2_emissions;
      }
      break;

    case 'manufacturing':
      // Scrap rate affects waste
      if (stageData.scrap_rate) {
        wasteGeneration *= (1 + stageData.scrap_rate / 100);
      }
      // Transport distance affects CO2
      if (stageData.transport_distance) {
        co2Emissions += stageData.transport_distance * 0.05; // 0.05 kg CO2 per km
      }
      break;

    case 'recycling':
      // Collection rate affects efficiency
      if (stageData.collection_rate) {
        const efficiency = stageData.collection_rate / 100;
        energyConsumption *= efficiency;
        co2Emissions *= efficiency;
      }
      // Scrap input reduces impact
      if (stageData.scrap_input_percentage) {
        const scrapBonus = 1 - (stageData.scrap_input_percentage / 100 * 0.5);
        energyConsumption *= scrapBonus;
        co2Emissions *= scrapBonus;
      }
      break;

    case 'valorization':
      // Waste utilization reduces impact
      if (stageData.waste_utilization_percentages) {
        const utilization = stageData.waste_utilization_percentages / 100;
        wasteGeneration *= (1 - utilization * 0.8);
      }
      break;
  }

  return {
    stageName,
    energyConsumption: Math.round(energyConsumption * 100) / 100,
    co2Emissions: Math.round(co2Emissions * 100) / 100,
    waterUsage: Math.round(waterUsage * 100) / 100,
    wasteGeneration: Math.round(wasteGeneration * 100) / 100,
    airQualityImpact: Math.round(airQualityImpact * 100) / 100,
    completed: true
  };
}

/**
 * Calculate circularity metrics
 * @param {Object} totals - Total impact metrics
 * @param {Array} stageData - Array of stage data
 * @returns {Object} Circularity metrics
 */
function calculateCircularityMetrics(totals, stageData) {
  // Find recycling stage data
  const recyclingStage = stageData.find(s => s.stageName === 'recycling');
  const valorizationStage = stageData.find(s => s.stageName === 'valorization');
  
  // Calculate material recovery rate
  let materialRecoveryRate = 0;
  if (recyclingStage && recyclingStage.completed) {
    // Assume 95% recovery from recycling
    materialRecoveryRate = 95 * 0.35; // 35% weight if recycling is included
  }
  if (valorizationStage && valorizationStage.completed) {
    materialRecoveryRate += 30; // Additional points for valorization
  }
  materialRecoveryRate = Math.min(100, Math.round(materialRecoveryRate * 10) / 10);

  // Calculate circularity score (0-100)
  // Based on: energy efficiency + waste reduction + recovery rate
  const maxEnergy = 100000; // Max expected energy
  const maxCO2 = 15000;     // Max expected CO2
  const maxWaste = 500;     // Max expected waste
  
  const energyScore = Math.max(0, 100 - (totals.totalEnergyConsumption / maxEnergy * 100));
  const emissionsScore = Math.max(0, 100 - (totals.totalCO2Emissions / maxCO2 * 100));
  const wasteScore = Math.max(0, 100 - (totals.totalWasteGeneration / maxWaste * 100));
  const recoveryScore = materialRecoveryRate;

  // Weighted average
  const circularityScore = (
    energyScore * 0.25 +
    emissionsScore * 0.30 +
    wasteScore * 0.20 +
    recoveryScore * 0.25
  );

  return {
    circularityScore: Math.round(circularityScore * 10) / 10,
    materialRecoveryRate: materialRecoveryRate,
    energyEfficiencyScore: Math.round(energyScore * 10) / 10,
    emissionsScore: Math.round(emissionsScore * 10) / 10,
    wasteReductionScore: Math.round(wasteScore * 10) / 10
  };
}

/**
 * Generate recommendations based on analysis
 * @param {Object} totals - Total impact metrics
 * @param {Array} stageData - Array of stage data
 * @returns {Array} Recommendations
 */
function generateRecommendations(totals, stageData) {
  const recommendations = [];

  // Energy recommendations
  if (totals.totalEnergyConsumption > 50000) {
    const smeltingStage = stageData.find(s => s.stageName === 'smelting');
    if (smeltingStage && smeltingStage.energyConsumption > 30000) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Optimize Smelting (Hall-Héroult) Energy Usage',
        description: 'Consider implementing energy recovery systems or switching to renewable energy sources for the smelting process, which is consuming a significant portion of total energy.'
      });
    }
  }

  // CO2 recommendations
  if (totals.totalCO2Emissions > 10000) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Implement Carbon Capture Technologies',
      description: 'High CO2 emissions detected. Consider carbon capture and storage (CCS) systems or carbon offset programs to reduce environmental impact.'
    });
  }

  // Circularity recommendations
  const recyclingStage = stageData.find(s => s.stageName === 'recycling');
  if (!recyclingStage || !recyclingStage.completed) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Enhance Circularity Performance',
      description: 'Integrate recycling processes to improve material recovery rate and overall circularity score.'
    });
  }

  // Water usage recommendations
  if (totals.totalWaterUsage > 5000) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Implement Water Recycling Systems',
      description: 'Significant water consumption detected. Implement closed-loop water systems to reduce water usage, especially in beneficiation and refining stages.'
    });
  }

  // Waste recommendations
  if (totals.totalWasteGeneration > 300) {
    const refiningStage = stageData.find(s => s.stageName === 'refining');
    if (refiningStage && refiningStage.wasteGeneration > 150) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Address Red Mud Management',
        description: 'High waste generation in refining stage (red mud). Explore valorization opportunities or improved red mud storage and treatment methods.'
      });
    }
  }

  // Air quality recommendations
  if (totals.totalAirQualityImpact > 2) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Improve Air Quality Control',
      description: 'Implement or upgrade air filtration systems to reduce particulate matter and gaseous emissions, particularly in smelting operations.'
    });
  }

  // Positive feedback if doing well
  if (totals.totalEnergyConsumption < 20000 && totals.totalCO2Emissions < 2000) {
    recommendations.push({
      priority: 'LOW',
      title: 'Maintain Current Best Practices',
      description: 'Your current process demonstrates excellent environmental performance. Continue monitoring and maintaining these standards.'
    });
  }

  return recommendations;
}

/**
 * @desc    Calculate LCA Score and Generate Report
 * @route   POST /api/lca/calculate
 * @access  Private (authenticated users only)
 */
const calculateLCA = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { workflowId, projectName, location, wizardData, currentStage } = req.body;

  // Validate required fields
  if (!projectName) {
    res.status(400);
    throw new Error('Project name is required');
  }

  if (!wizardData || typeof wizardData !== 'object') {
    res.status(400);
    throw new Error('Wizard data is required');
  }

  console.log('📊 [LCA Calculation] Starting calculation for user:', userId);
  console.log('📊 [LCA Calculation] Project:', projectName);
  console.log('📊 [LCA Calculation] Workflow ID:', workflowId);
  console.log('📊 [LCA Calculation] Current Stage:', currentStage);

  // Declare lcaRecord outside try block so it's accessible in catch block
  let lcaRecord = null;

  try {
    // Backend validation: Check that at least one stage has data
    const allStageNames = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
    const stagesWithData = allStageNames.filter(stage => 
      wizardData[stage] && Object.keys(wizardData[stage]).length > 0
    );

    if (stagesWithData.length === 0) {
      res.status(400);
      throw new Error('No stage data provided. Please fill at least one stage before calculating LCA.');
    }

    console.log('✅ [LCA Calculation] Stages with data:', stagesWithData.join(', '));

    // Log the actual data received for debugging
    stagesWithData.forEach(stage => {
      console.log(`📋 [LCA Validation] ${stage} data keys:`, Object.keys(wizardData[stage]));
      console.log(`📋 [LCA Validation] ${stage} data:`, JSON.stringify(wizardData[stage], null, 2));
    });

    // Validate required fields - ONLY up to and including current stage if provided
    // These field names should match what the frontend sends after mapping
    const validationErrors = [];
    const requiredFieldsByStage = {
      mining: ['mining_method', 'location', 'mining_ore_grade_percent'],
      beneficiation: ['beneficiation_process_Crushing', 'ore_feed_rate'],
      refining: ['energy_use', 'water_use'],
      smelting: ['electricity_demand', 'cell_technology'],
      manufacturing: ['manufacturing_process_Casting', 'scrap_rate'],
      recycling: ['scrap_input_percentage', 'collection_rate'],
      valorization: ['waste_types', 'valorization_methods']
    };

    // Define stage order for progressive validation
    const stageOrder = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];

    // Determine which stages to validate
    let stagesToValidate;
    if (currentStage) {
      // Validate current stage and all previous stages
      const currentStageIndex = stageOrder.indexOf(currentStage);
      if (currentStageIndex >= 0) {
        // Get all stages up to and including current stage that have data
        stagesToValidate = stageOrder
          .slice(0, currentStageIndex + 1)
          .filter(stage => stagesWithData.includes(stage));
        console.log(`🔍 [LCA Validation] Current stage: ${currentStage} (index ${currentStageIndex})`);
      } else {
        // Invalid stage name, validate all
        stagesToValidate = stagesWithData;
      }
    } else {
      // No current stage specified, validate all stages with data
      stagesToValidate = stagesWithData;
    }

    console.log('🔍 [LCA Validation] Validating stages:', stagesToValidate);

    stagesToValidate.forEach(stage => {
      const requiredFields = requiredFieldsByStage[stage];
      if (requiredFields) {
        const stageData = wizardData[stage];
        const missingFields = requiredFields.filter(field => {
          const value = stageData[field];
          const isEmpty = value === undefined || value === null || value === '' || 
                 (Array.isArray(value) && value.length === 0) ||
                 (typeof value === 'number' && isNaN(value));
          
          if (isEmpty) {
            console.log(`❌ [LCA Validation] ${stage}.${field} is missing or empty. Value:`, value);
          }
          
          return isEmpty;
        });

        if (missingFields.length > 0) {
          validationErrors.push({
            stage: stage,
            missingFields: missingFields
          });
        }
      }
    });

    if (validationErrors.length > 0) {
      console.log('❌ [LCA Validation] Validation errors:', validationErrors);
      const firstError = validationErrors[0];
      const stageName = firstError.stage.charAt(0).toUpperCase() + firstError.stage.slice(1);
      res.status(400);
      throw new Error(`Required fields missing for stage: ${stageName}. Missing fields: ${firstError.missingFields.join(', ')}`);
    }
    
    console.log('✅ [LCA Validation] All required fields present for validated stages');

    // Fetch metalType from workflow if workflowId is provided
    let metalType = 'Aluminium'; // default
    if (workflowId) {
      try {
        const workflow = await WizardWorkflow.findById(workflowId).select('metalType');
        if (workflow && workflow.metalType) {
          metalType = workflow.metalType;
          console.log('📊 [LCA Calculation] Retrieved metalType from workflow:', metalType);
        }
      } catch (err) {
        console.warn('⚠️ [LCA Calculation] Could not fetch workflow metalType:', err.message);
      }
    }

    // Create initial LCA record with pending status
    lcaRecord = new CalculateLCA({
      userId,
      workflowId: workflowId || null,
      projectName,
      location: location || 'Not specified',
      metalType,
      status: 'pending',
      calculationParams: {
        wizardData: Object.keys(wizardData)
      }
    });

    await lcaRecord.save();
    console.log('✅ [LCA Calculation] Created LCA record:', lcaRecord._id);

    // Process each stage and calculate impacts
    const stageData = [];
    const totals = {
      totalEnergyConsumption: 0,
      totalCO2Emissions: 0,
      totalWaterUsage: 0,
      totalWasteGeneration: 0,
      totalAirQualityImpact: 0
    };

    const stageNames = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
    
    stageNames.forEach(stageName => {
      if (wizardData[stageName] && Object.keys(wizardData[stageName]).length > 0) {
        console.log(`📊 [LCA Calculation] Processing ${stageName} stage...`);
        
        const impact = calculateStageImpact(stageName, wizardData[stageName]);
        stageData.push(impact);

        // Accumulate totals
        totals.totalEnergyConsumption += impact.energyConsumption;
        totals.totalCO2Emissions += impact.co2Emissions;
        totals.totalWaterUsage += impact.waterUsage;
        totals.totalWasteGeneration += impact.wasteGeneration;
        totals.totalAirQualityImpact += impact.airQualityImpact;
      }
    });

    // Round totals
    Object.keys(totals).forEach(key => {
      totals[key] = Math.round(totals[key] * 100) / 100;
    });

    console.log('📊 [LCA Calculation] Calculated totals:', totals);

    // Calculate intensity metrics (per kg aluminum, assuming 1000 kg production)
    const productionAmount = 1000;
    const intensityMetrics = {
      energyIntensity: Math.round((totals.totalEnergyConsumption / productionAmount) * 100) / 100,
      carbonIntensity: Math.round((totals.totalCO2Emissions / productionAmount) * 100) / 100
    };

    // Calculate circularity metrics
    const circularityMetrics = calculateCircularityMetrics(totals, stageData);
    console.log('📊 [LCA Calculation] Circularity metrics:', circularityMetrics);

    // Generate recommendations
    const recommendations = generateRecommendations(totals, stageData);
    console.log('📊 [LCA Calculation] Generated', recommendations.length, 'recommendations');

    // Update LCA record with calculated values
    lcaRecord.totalEnergyConsumption = totals.totalEnergyConsumption;
    lcaRecord.totalCO2Emissions = totals.totalCO2Emissions;
    lcaRecord.totalWaterUsage = totals.totalWaterUsage;
    lcaRecord.totalWasteGeneration = totals.totalWasteGeneration;
    lcaRecord.totalAirQualityImpact = totals.totalAirQualityImpact;
    lcaRecord.energyIntensity = intensityMetrics.energyIntensity;
    lcaRecord.carbonIntensity = intensityMetrics.carbonIntensity;
    lcaRecord.circularityScore = circularityMetrics.circularityScore;
    lcaRecord.materialRecoveryRate = circularityMetrics.materialRecoveryRate;
    lcaRecord.stageData = stageData;
    lcaRecord.recommendations = recommendations;

    // Generate PDF report
    console.log('📄 [LCA Calculation] Generating PDF report...');
    const filename = generateFilename(userId.toString(), projectName);
    const uploadsDir = path.join(process.cwd(), 'uploads', 'lca-reports');
    const outputPath = path.join(uploadsDir, filename);

    const reportInfo = await generateLCAReport(lcaRecord.toObject(), outputPath);
    console.log('✅ [LCA Calculation] PDF generated:', reportInfo.filename);

    // Store relative URL for the PDF
    const pdfUrl = `/uploads/lca-reports/${filename}`;
    await lcaRecord.markCompleted(pdfUrl, reportInfo.filename, reportInfo.size);

    console.log('✅ [LCA Calculation] LCA calculation completed successfully');

    // Send response
    res.status(200).json({
      success: true,
      message: 'LCA Report Generated Successfully',
      data: {
        reportId: lcaRecord._id,
        pdfUrl: pdfUrl,
        pdfFilename: reportInfo.filename,
        summary: lcaRecord.getSummary()
      }
    });

  } catch (error) {
    console.error('❌ [LCA Calculation] Error:', error);
    
    // Update record as failed if it exists
    if (lcaRecord) {
      await lcaRecord.markFailed(error.message);
    }

    res.status(500);
    throw new Error(`Failed to calculate LCA: ${error.message}`);
  }
});

/**
 * @desc    Get all LCA reports for current user
 * @route   GET /api/lca/reports
 * @access  Private
 */
const getUserLCAReports = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 20, page = 1, status } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reports = await CalculateLCA.findByUser(userId, {
    limit: parseInt(limit),
    skip,
    status: status || null
  });

  const total = await CalculateLCA.countDocuments({ 
    userId,
    ...(status && { status })
  });

  res.status(200).json({
    success: true,
    data: {
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get specific LCA report by ID
 * @route   GET /api/lca/reports/:id
 * @access  Private
 */
const getLCAReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const report = await CalculateLCA.findOne({ _id: id, userId })
    .select('-__v');

  if (!report) {
    res.status(404);
    throw new Error('LCA report not found');
  }

  res.status(200).json({
    success: true,
    data: { report }
  });
});

/**
 * @desc    Get LCA statistics for current user
 * @route   GET /api/lca/stats
 * @access  Private
 */
const getUserLCAStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await CalculateLCA.getUserStats(userId);

  res.status(200).json({
    success: true,
    data: { stats }
  });
});

/**
 * @desc    Get calculatelca report by ID (enriched format for analytics)
 * @route   GET /api/lca/calculatelca/:id
 * @access  Private
 */
const getCalculatelcaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const report = await CalculateLCA.findOne({ _id: id, userId })
    .select('-__v');

  if (!report) {
    res.status(404);
    throw new Error('LCA report not found');
  }

  // Transform stageData array to object format for frontend
  const lcaStages = {};
  if (report.stageData && Array.isArray(report.stageData)) {
    report.stageData.forEach(stage => {
      lcaStages[stage.stageName] = {
        energyConsumption: stage.energyConsumption,
        co2Emissions: stage.co2Emissions,
        waterUsage: stage.waterUsage,
        wasteGeneration: stage.wasteGeneration,
        airQualityImpact: stage.airQualityImpact,
        completed: stage.completed
      };
    });
  }

  // Return enriched format for analytics
  const enrichedReport = {
    _id: report._id,
    workflowId: report.workflowId,
    projectName: report.projectName,
    metalType: report.metalType,
    location: report.location,
    analysisDate: { $date: report.analysisDate.toISOString() },
    status: report.status,
    
    // Totals
    totalEnergyConsumption: report.totalEnergyConsumption,
    totalCO2Emissions: report.totalCO2Emissions,
    totalWaterUsage: report.totalWaterUsage,
    totalWasteGeneration: report.totalWasteGeneration,
    totalAirQualityImpact: report.totalAirQualityImpact,
    
    // Intensity
    energyIntensity: report.energyIntensity,
    carbonIntensity: report.carbonIntensity,
    
    // Circularity
    circularityScore: report.circularityScore,
    circularityRating: report.circularityRating,
    materialRecoveryRate: report.materialRecoveryRate,
    circularityIndex: report.circularityIndex,
    linearityIndex: report.linearityIndex,
    circularityComponents: report.circularityComponents,
    
    // Stage data
    lcaStages: lcaStages,
    
    // Sankey data for circularity visualization
    sankeyData: report.sankeyData,
    
    // Recommendations
    recommendations: report.recommendations,
    
    // Metadata
    metadata: report.metadata,
    
    // PDF
    pdfReportUrl: report.pdfReportUrl,
    pdfFilename: report.pdfFilename,
    
    // Timestamps
    createdAt: { $date: report.createdAt.toISOString() },
    updatedAt: { $date: report.updatedAt.toISOString() }
  };

  res.status(200).json({
    success: true,
    data: enrichedReport
  });
});

/**
 * @desc    Delete LCA report
 * @route   DELETE /api/lca/reports/:id
 * @access  Private
 */
const deleteLCAReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const report = await CalculateLCA.findOne({ _id: id, userId });

  if (!report) {
    res.status(404);
    throw new Error('LCA report not found');
  }

  await report.deleteOne();

  res.status(200).json({
    success: true,
    message: 'LCA report deleted successfully'
  });
});

/**
 * @desc    Download LCA report as PDF
 * @route   GET /api/lca/reports/:id/pdf
 * @access  Private
 */
const downloadLCAReportPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Find report and verify ownership
  const report = await CalculateLCA.findOne({ _id: id, userId });

  if (!report) {
    res.status(404);
    throw new Error('LCA report not found');
  }

  // Check if PDF already exists
  if (report.pdfReportUrl && report.pdfFilename) {
    const pdfPath = path.join(__dirname, '../../', report.pdfReportUrl);
    const fs = require('fs');
    
    if (fs.existsSync(pdfPath)) {
      // Serve existing PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.pdfFilename}"`);
      return res.sendFile(pdfPath);
    }
  }

  // Generate new PDF if it doesn't exist
  const uploadsDir = path.join(__dirname, '../../uploads/reports');
  const fs = require('fs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = generateFilename(report.projectName || 'LCA-Report');
  const pdfPath = path.join(uploadsDir, filename);

  // Prepare data for PDF generation
  const lcaData = {
    projectName: report.projectName,
    location: report.location,
    metalType: report.metalType,
    analysisDate: report.analysisDate,
    totalEnergyConsumption: typeof report.totalEnergyConsumption === 'object' 
      ? report.totalEnergyConsumption.value 
      : report.totalEnergyConsumption,
    totalCO2Emissions: typeof report.totalCO2Emissions === 'object'
      ? report.totalCO2Emissions.value
      : report.totalCO2Emissions,
    totalWaterUsage: typeof report.totalWaterUsage === 'object'
      ? report.totalWaterUsage.value
      : report.totalWaterUsage,
    totalWasteGeneration: typeof report.totalWasteGeneration === 'object'
      ? report.totalWasteGeneration.value
      : report.totalWasteGeneration,
    totalAirQualityImpact: typeof report.totalAirQualityImpact === 'object'
      ? report.totalAirQualityImpact.value
      : report.totalAirQualityImpact,
    energyIntensity: typeof report.energyIntensity === 'object'
      ? report.energyIntensity.value
      : report.energyIntensity,
    carbonIntensity: typeof report.carbonIntensity === 'object'
      ? report.carbonIntensity.value
      : report.carbonIntensity,
    circularityScore: typeof report.circularityScore === 'object'
      ? report.circularityScore.value
      : report.circularityScore,
    circularityRating: report.circularityRating,
    materialRecoveryRate: typeof report.materialRecoveryRate === 'object'
      ? report.materialRecoveryRate.value
      : report.materialRecoveryRate,
    circularityIndex: typeof report.circularityIndex === 'object'
      ? report.circularityIndex.value
      : report.circularityIndex,
    linearityIndex: typeof report.linearityIndex === 'object'
      ? report.linearityIndex.value
      : report.linearityIndex,
    lcaStages: report.lcaStages || {},
    recommendations: report.recommendations || [],
    sankeyData: report.sankeyData,
  };

  try {
    // Generate PDF
    await generateLCAReport(lcaData, pdfPath);

    // Update report with PDF info
    report.pdfReportUrl = `/uploads/reports/${filename}`;
    report.pdfFilename = filename;
    report.pdfFileSize = fs.statSync(pdfPath).size;
    await report.save();

    // Send PDF to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500);
    throw new Error('Failed to generate PDF report');
  }
});

module.exports = {
  calculateLCA,
  getUserLCAReports,
  getLCAReportById,
  getCalculatelcaById,
  getUserLCAStats,
  deleteLCAReport,
  downloadLCAReportPDF
};
