/**
 * LCA Calculation Engine
 * 
 * Handles all Life Cycle Assessment calculations for canvas workflows.
 * Computes environmental impact, circularity scores, and generates impact reports.
 * 
 * @module utils/lcaCalculator
 */

/**
 * Calculate total environmental impacts from workflow
 * @param {Array} operations - Array of operations with impact data
 * @returns {Object} Total impact metrics
 */
function calculateTotalImpact(operations) {
  if (!operations || operations.length === 0) {
    return {
      totalGWP: 0,
      totalWaterUsage: 0,
      totalWasteGenerated: 0,
      totalEnergyRequired: 0,
      averageRecoveryRate: 0
    };
  }

  let totalGWP = 0;
  let totalWaterUsage = 0;
  let totalWasteGenerated = 0;
  let totalEnergyRequired = 0;
  let totalRecoveryRate = 0;
  let totalCost = 0;
  let totalTime = 0;
  let circularityPoints = 0;

  operations.forEach((op, index) => {
    // Get values from either impactData or direct properties
    const gwp = op.impactData?.gwp || op.gwp || op.environmentalImpact?.gwp || 0;
    const waterUsage = op.impactData?.waterUsage || op.environmentalImpact?.waterUsage || 0;
    const wasteGenerated = op.impactData?.wasteGenerated || op.environmentalImpact?.wasteGeneration || 0;
    const energyRequired = op.impactData?.energyRequired || op.resourceUsage?.energy || 0;
    const recoveryRate = op.impactData?.recoveryRate || op.recoveryRate || 0;
    const cost = op.costEstimate || 0;
    const time = op.timeEstimate || 0;
    const circularityImpact = op.circularityImpact || 0;
    const quantity = op.quantity || 1;

    // Apply stage efficiency multiplier (recycling stages are more efficient)
    const stageEfficiencyMultiplier = 1 - (index * 0.02);
    const efficiency = (op.efficiency || 1) * Math.max(0.6, stageEfficiencyMultiplier);

    totalGWP += gwp * quantity * efficiency;
    totalWaterUsage += waterUsage * quantity * efficiency;
    totalWasteGenerated += wasteGenerated * quantity * efficiency;
    totalEnergyRequired += energyRequired * quantity * efficiency;
    totalRecoveryRate += recoveryRate;
    totalCost += cost * quantity;
    totalTime += time;
    circularityPoints += circularityImpact * efficiency;
  });

  const operationCount = operations.length;

  return {
    totalGWP: Math.round(totalGWP * 100) / 100,
    averageGWP: Math.round((totalGWP / Math.max(operationCount, 1)) * 100) / 100,
    totalWaterUsage: Math.round(totalWaterUsage * 100) / 100,
    totalWasteGenerated: Math.round(totalWasteGenerated * 100) / 100,
    totalEnergyRequired: Math.round(totalEnergyRequired * 100) / 100,
    averageRecoveryRate: Math.round((totalRecoveryRate / Math.max(operationCount, 1)) * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalTime: Math.round(totalTime * 100) / 100,
    circularityPoints: Math.round(circularityPoints * 100) / 100,
    operationCount
  };
}

/**
 * Calculate circularity score based on workflow operations
 * 
 * Circularity Score = (Average Recovery Rate + Waste Reduction + Energy Efficiency) / 3
 * 
 * @param {Object} impactData - Total impact metrics
 * @param {number} operationCount - Number of operations
 * @returns {number} Circularity score (0-100)
 */
function calculateCircularityScore(impactData, operationCount) {
  if (!impactData || operationCount === 0) {
    return 0;
  }

  // Base recovery rate component (0-100)
  const recoveryComponent = Math.min(impactData.averageRecoveryRate, 100);

  // Waste reduction component (lower waste = higher score)
  // Max 30% waste is considered good (70 points), 0% is 100 points
  const wasteComponent = Math.max(0, 100 - (impactData.totalWasteGenerated * 0.5));

  // Energy efficiency component
  // Lower energy is better, normalize to 0-100 scale
  const energyComponent = Math.max(0, 100 - (impactData.totalEnergyRequired * 0.1));

  // Water efficiency component
  // Lower water usage is better
  const waterComponent = Math.max(0, 100 - (impactData.totalWaterUsage * 0.01));

  // Operation diversity bonus
  // More stages used = better process design
  const diversityBonus = Math.min(20, operationCount * 2);

  // Weighted average
  const score = 
    (recoveryComponent * 0.35) +
    (wasteComponent * 0.25) +
    (energyComponent * 0.20) +
    (waterComponent * 0.15) +
    (diversityBonus * 0.05);

  return Math.min(100, Math.round(score * 100) / 100);
}

/**
 * Calculate environmental intensity (impact per unit output)
 * @param {Object} impactData - Total impact metrics
 * @param {number} totalVolume - Total material volume processed
 * @returns {Object} Intensity metrics
 */
function calculateEnvironmentalIntensity(impactData, totalVolume = 1) {
  if (totalVolume === 0) return { gwpPerUnit: 0, waterPerUnit: 0, energyPerUnit: 0 };

  return {
    gwpPerUnit: Math.round((impactData.totalGWP / totalVolume) * 100) / 100,
    waterPerUnit: Math.round((impactData.totalWaterUsage / totalVolume) * 100) / 100,
    energyPerUnit: Math.round((impactData.totalEnergyRequired / totalVolume) * 100) / 100
  };
}

/**
 * Calculate stage-by-stage cumulative impact
 * Shows how impact compounds through stages
 * 
 * @param {Array} stages - Workflow stages with operations
 * @returns {Array} Cumulative impact by stage
 */
function calculateStageCumulativeImpact(stages) {
  const cumulativeImpacts = [];
  let runningGWP = 0;
  let runningWaterUsage = 0;
  let runningEnergyRequired = 0;

  stages.forEach((stage, index) => {
    let stageGWP = 0;
    let stageWaterUsage = 0;
    let stageEnergyRequired = 0;

    stage.operations.forEach(op => {
      if (op.impactData) {
        stageGWP += (op.impactData.gwp || 0) * (op.quantity || 1);
        stageWaterUsage += (op.impactData.waterUsage || 0) * (op.quantity || 1);
        stageEnergyRequired += (op.impactData.energyRequired || 0) * (op.quantity || 1);
      }
    });

    runningGWP += stageGWP;
    runningWaterUsage += stageWaterUsage;
    runningEnergyRequired += stageEnergyRequired;

    cumulativeImpacts.push({
      stageId: stage.stageId,
      stageName: stage.stageName,
      stageNumber: stage.stageNumber,
      stageGWP,
      stageWaterUsage,
      stageEnergyRequired,
      cumulativeGWP: Math.round(runningGWP * 100) / 100,
      cumulativeWaterUsage: Math.round(runningWaterUsage * 100) / 100,
      cumulativeEnergyRequired: Math.round(runningEnergyRequired * 100) / 100,
      operationCount: stage.operations.length
    });
  });

  return cumulativeImpacts;
}

/**
 * Get environmental rating based on circularity score
 * @param {number} score - Circularity score (0-100)
 * @returns {Object} Rating with description
 */
function getEnvironmentalRating(score) {
  if (score >= 85) {
    return {
      rating: 'Excellent',
      level: 5,
      color: '#10b981',
      description: 'Industry-leading environmental performance'
    };
  } else if (score >= 70) {
    return {
      rating: 'Good',
      level: 4,
      color: '#84cc16',
      description: 'Above average environmental practices'
    };
  } else if (score >= 55) {
    return {
      rating: 'Fair',
      level: 3,
      color: '#f59e0b',
      description: 'Moderate environmental performance'
    };
  } else if (score >= 40) {
    return {
      rating: 'Poor',
      level: 2,
      color: '#ef4444',
      description: 'Below average, improvement needed'
    };
  } else {
    return {
      rating: 'Critical',
      level: 1,
      color: '#dc2626',
      description: 'Significant environmental concerns'
    };
  }
}

/**
 * Identify improvement opportunities in workflow
 * @param {Array} operations - Workflow operations
 * @param {Object} impactData - Total impact metrics
 * @returns {Array} Recommendations
 */
function getImprovementOpportunities(operations, impactData) {
  const opportunities = [];

  // High waste scenario
  if (impactData.totalWasteGenerated > 30) {
    opportunities.push({
      type: 'waste-reduction',
      priority: 'high',
      title: 'Reduce Process Waste',
      description: `Current waste level (${impactData.totalWasteGenerated.toFixed(1)}%) is above industry standard. Consider operations with higher waste recovery rates.`,
      impact: 'Potential 15-25% circularity score improvement'
    });
  }

  // High energy consumption
  if (impactData.totalEnergyRequired > 500) {
    opportunities.push({
      type: 'energy-efficiency',
      priority: 'high',
      title: 'Improve Energy Efficiency',
      description: `Energy consumption is high (${impactData.totalEnergyRequired.toFixed(1)} kWh). Consider renewable energy sources or more efficient operations.`,
      impact: 'Potential 10-20% GWP reduction'
    });
  }

  // High water usage
  if (impactData.totalWaterUsage > 1000) {
    opportunities.push({
      type: 'water-conservation',
      priority: 'medium',
      title: 'Optimize Water Usage',
      description: `Water consumption is significant (${impactData.totalWaterUsage.toFixed(1)}L). Implement water recycling systems.`,
      impact: 'Potential 20-30% water reduction'
    });
  }

  // Low recovery rate
  if (impactData.averageRecoveryRate < 60) {
    opportunities.push({
      type: 'recovery-improvement',
      priority: 'high',
      title: 'Increase Material Recovery',
      description: `Recovery rate is below optimal (${impactData.averageRecoveryRate.toFixed(1)}%). Add operations with higher recovery potential.`,
      impact: 'Potential 20-30% circularity improvement'
    });
  }

  // Low GWP (positive indicator)
  if (impactData.totalGWP < 10) {
    opportunities.push({
      type: 'scalability',
      priority: 'medium',
      title: 'Scale Up Production',
      description: 'Your low environmental intensity makes this workflow ideal for scaling to larger production volumes.',
      impact: 'Opportunity for market expansion'
    });
  }

  return opportunities;
}

/**
 * Generate comprehensive LCA report
 * @param {Object} workflow - Canvas workflow object
 * @returns {Object} Complete LCA report
 */
function generateLCAReport(workflow) {
  const allOperations = workflow.getAllOperations ? workflow.getAllOperations() : [];
  const impactData = calculateTotalImpact(allOperations);
  const circularityScore = calculateCircularityScore(impactData, allOperations.length);
  const rating = getEnvironmentalRating(circularityScore);
  const intensity = calculateEnvironmentalIntensity(impactData);
  const cumulativeImpacts = calculateStageCumulativeImpact(workflow.stages);
  const opportunities = getImprovementOpportunities(allOperations, impactData);

  return {
    summary: {
      workflowName: workflow.name,
      metalType: workflow.metalType,
      createdAt: workflow.createdAt,
      operationCount: allOperations.length,
      stageCount: workflow.stages.filter(s => s.operations.length > 0).length
    },
    impacts: impactData,
    circularityScore,
    environmentalRating: rating,
    environmentalIntensity: intensity,
    stageCumulativeImpacts: cumulativeImpacts,
    opportunities,
    comparison: {
      industryAverage: {
        gwp: 25,
        circularityScore: 62
      },
      userVsIndustry: {
        gwpDifference: (impactData.totalGWP - 25).toFixed(2),
        circularityDifference: (circularityScore - 62).toFixed(2),
        isAboveAverage: circularityScore > 62
      }
    }
  };
}

module.exports = {
  calculateTotalImpact,
  calculateCircularityScore,
  calculateEnvironmentalIntensity,
  calculateStageCumulativeImpact,
  getEnvironmentalRating,
  getImprovementOpportunities,
  generateLCAReport
};
