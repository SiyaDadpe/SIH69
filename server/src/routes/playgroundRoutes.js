import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import axios from 'axios';

const router = express.Router();

// Fast LCA calculation endpoint for playground - no database storage
router.post('/calculate', authenticateToken, async (req, res) => {
  try {
    const { formData } = req.body;

    if (!formData) {
      return res.status(400).json({
        success: false,
        message: 'Form data is required'
      });
    }

    // Prepare data for ML models
    const stages = {
      mining: prepareStageData(formData['1. Mining (Bauxite Extraction)'], 'mining'),
      beneficiation: prepareStageData(formData['2. Beneficiation (Ore Processing)'], 'beneficiation'),
      refining: prepareStageData(formData['3. Alumina Refining (Bayer Process)'], 'refining'),
      smelting: prepareStageData(formData['4. Aluminium Smelting (Hall-Héroult)'], 'smelting'),
      manufacturing: prepareStageData(formData['5. Fabrication & Use Phase'], 'manufacturing'),
      recycling: prepareStageData(formData['6. Recycling (End-of-Life)'], 'recycling'),
      valorization: prepareStageData(formData['7. Waste Valorization'], 'valorization')
    };

    // Call ML prediction endpoints in parallel for speed
    const predictions = await Promise.all([
      callMLModel('http://localhost:8001/predict', stages.mining),
      callMLModel('http://localhost:8002/predict', stages.beneficiation),
      callMLModel('http://localhost:8003/predict', stages.refining),
      callMLModel('http://localhost:8004/predict', stages.smelting),
      callMLModel('http://localhost:8005/predict', stages.manufacturing),
      callMLModel('http://localhost:8006/predict', stages.recycling),
      callMLModel('http://localhost:8007/predict', stages.valorization)
    ]);

    // Aggregate results
    const aggregatedResults = {
      totalCO2: 0,
      totalEnergy: 0,
      stageBreakdown: {
        mining: predictions[0],
        beneficiation: predictions[1],
        refining: predictions[2],
        smelting: predictions[3],
        manufacturing: predictions[4],
        recycling: predictions[5],
        valorization: predictions[6]
      }
    };

    // Sum up CO2 and energy from all stages
    predictions.forEach((pred, index) => {
      if (pred?.predicted) {
        // Extract CO2 emissions
        const co2Fields = Object.keys(pred.predicted).filter(key => 
          key.includes('co2') || key.includes('CO2') || key.includes('emission')
        );
        co2Fields.forEach(field => {
          aggregatedResults.totalCO2 += parseFloat(pred.predicted[field]) || 0;
        });

        // Extract energy consumption
        const energyFields = Object.keys(pred.predicted).filter(key => 
          key.includes('energy') || key.includes('Energy') || key.includes('kWh') || key.includes('MJ')
        );
        energyFields.forEach(field => {
          aggregatedResults.totalEnergy += parseFloat(pred.predicted[field]) || 0;
        });
      }
    });

    // Calculate ratings
    const co2Rating = aggregatedResults.totalCO2 < 8000 ? "Excellent" : 
                     aggregatedResults.totalCO2 < 10000 ? "Good" : 
                     aggregatedResults.totalCO2 < 12000 ? "Average" : "Poor";
    
    const energyRating = aggregatedResults.totalEnergy < 14000 ? "Excellent" : 
                        aggregatedResults.totalEnergy < 16000 ? "Good" : 
                        aggregatedResults.totalEnergy < 18000 ? "Average" : "Poor";

    // Calculate overall score (0-100, higher is better)
    const overallScore = Math.max(0, Math.min(100, 
      100 - (aggregatedResults.totalCO2 / 150) - (aggregatedResults.totalEnergy / 250)
    ));

    // Generate recommendations
    const recommendations = generateRecommendations(
      aggregatedResults.totalCO2, 
      aggregatedResults.totalEnergy,
      overallScore,
      formData
    );

    res.json({
      success: true,
      data: {
        co2: Math.round(aggregatedResults.totalCO2),
        energy: Math.round(aggregatedResults.totalEnergy),
        co2Rating,
        energyRating,
        overallScore: Math.round(overallScore),
        baseline: { co2: 12000, energy: 18000 },
        stageBreakdown: aggregatedResults.stageBreakdown,
        recommendations,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Playground calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate LCA',
      error: error.message
    });
  }
});

// Helper function to prepare stage data for ML models
function prepareStageData(stageData, stageName) {
  if (!stageData) return {};

  const prepared = {};
  
  // Map playground fields to ML model expected fields
  Object.entries(stageData).forEach(([key, value]) => {
    // Convert field names to snake_case for ML models
    const fieldName = key.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[()]/g, '')
      .replace(/₂/g, '2')
      .replace(/₃/g, '3')
      .replace(/%/g, 'percent')
      .replace(/\//g, '_per_')
      .replace(/³/g, '3');
    
    // Handle multiselect fields (arrays)
    if (Array.isArray(value)) {
      prepared[fieldName] = value.join(',');
    } else {
      prepared[fieldName] = value;
    }
  });

  return prepared;
}

// Helper function to call ML model APIs
async function callMLModel(url, data) {
  try {
    const response = await axios.post(url, data, {
      timeout: 5000, // 5 second timeout for fast response
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.warn(`ML model call failed for ${url}:`, error.message);
    // Return null if model fails - don't block entire calculation
    return { predicted: {} };
  }
}

// Helper function to generate recommendations
function generateRecommendations(co2, energy, score, formData) {
  const recommendations = [];

  // High impact detection
  if (score < 50) {
    recommendations.push({
      type: 'critical',
      title: 'High Impact Detected',
      message: 'Consider increasing recycled content and renewable energy sources.',
      icon: 'alert'
    });
  }

  // CO2 reduction opportunities
  if (co2 > 10000) {
    recommendations.push({
      type: 'warning',
      title: 'CO₂ Reduction Opportunity',
      message: 'Switch to electric equipment and renewable energy mix in smelting.',
      icon: 'trending-down'
    });
  }

  // Excellent performance
  if (score >= 70) {
    recommendations.push({
      type: 'success',
      title: 'Excellent Performance',
      message: 'Your configuration demonstrates sustainable practices with low environmental impact.',
      icon: 'check'
    });
  }

  // Recycling optimization
  const recyclingData = formData['6. Recycling (End-of-Life)'];
  if (recyclingData) {
    const currentYield = recyclingData['Recovery Yield (%)'] || 85;
    if (currentYield < 95) {
      recommendations.push({
        type: 'info',
        title: 'Optimize Recycling',
        message: `Increase recovery yield to ${Math.min(95, currentYield + 10)}% for better results.`,
        icon: 'recycle'
      });
    }
  }

  // Energy source recommendations
  const smeltingData = formData['4. Aluminium Smelting (Hall-Héroult)'];
  if (smeltingData && smeltingData['Energy Source'] === 'Grid') {
    recommendations.push({
      type: 'info',
      title: 'Switch to Renewable Energy',
      message: 'Using renewable energy mix can reduce CO₂ emissions by up to 40%.',
      icon: 'leaf'
    });
  }

  // Waste valorization
  const valorizationData = formData['7. Waste Valorization'];
  if (valorizationData) {
    const wasteUtilized = valorizationData['Waste Utilized (%)'] || 0;
    if (wasteUtilized < 50) {
      recommendations.push({
        type: 'info',
        title: 'Increase Waste Valorization',
        message: 'Utilizing more waste products can significantly reduce environmental impact.',
        icon: 'leaf'
      });
    }
  }

  return recommendations;
}

export default router;
