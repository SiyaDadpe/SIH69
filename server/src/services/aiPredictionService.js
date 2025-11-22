/**
 * AI Prediction Service
 * 
 * Generates AI-based predictions for empty fields in wizard workflow steps
 * Based on the reference data from fake.md
 * 
 * @module services/aiPredictionService
 */

const logger = require('../utils/logger');

/**
 * Prediction rules based on fake.md for each stage
 */
const PREDICTION_RULES = {
  mining: {
    required: ['mining_method', 'mining_ore_grade_percent', 'location'],
    predictions: {
      mining_energy_MJ_per_t_ore: { value: 620, confidence: 0.85 },
      mining_co2_kg_per_t_ore: { value: 68, confidence: 0.85 },
      mining_sox_kg_per_t_ore: { value: 0.5, confidence: 0.85 },
      mining_nox_kg_per_t_ore: { value: 1.2, confidence: 0.85 },
      mining_pm_kg_per_t_ore: { value: 0.8, confidence: 0.85 }
    }
  },
  
  beneficiation: {
    required: ['beneficiation_process_Crushing', 'ore_feed_rate', 'location'],
    predictions: {
      beneficiation_water_m3_per_t_ore: { value: 1.5, confidence: 0.82 },
      beneficiation_electricity_kWh_per_t_ore: { value: 24, confidence: 0.82 },
      beneficiation_tailings_management: { value: 'Thickened', confidence: 0.82 },
      beneficiation_noise_pollution: { value: 'Moderate', confidence: 0.82 },
      beneficiation_dust_pollution: { value: 'Moderate', confidence: 0.82 }
    }
  },
  
  refining: {
    required: ['energy_use', 'water_use', 'red_mud_generation'],
    predictions: {
      refining_energy_MJ_per_t_alumina: { value: 12500, confidence: 0.88 },
      refining_water_m3_per_t_alumina: { value: 3.2, confidence: 0.88 },
      refining_red_mud_kg_per_t_alumina: { value: 1300, confidence: 0.88 },
      refining_caustic_soda_kg_per_t_alumina: { value: 12, confidence: 0.88 },
      refining_lime_kg_per_t_alumina: { value: 9, confidence: 0.88 },
      refining_so2_kg_per_t_alumina: { value: 1.5, confidence: 0.88 },
      refining_nox_kg_per_t_alumina: { value: 2.1, confidence: 0.88 },
      refining_dust_kg_per_t_alumina: { value: 0.7, confidence: 0.88 }
    }
  },
  
  smelting: {
    required: ['electricity_demand', 'co2_emissions', 'cell_technology'],
    predictions: {
      smelting_energy_kWh_per_t_al: { value: 15400, confidence: 0.90 },
      smelting_energy_MJ_per_t_al: { value: 55440, confidence: 0.90 },
      smelting_co2_kg_per_t_al: { value: 1750, confidence: 0.90 },
      smelting_pfc_kg_per_t_al: { value: 85, confidence: 0.90 },
      smelting_so2_kg_per_t_al: { value: 3.2, confidence: 0.90 },
      smelting_nox_kg_per_t_al: { value: 2.5, confidence: 0.90 },
      smelting_fluoride_recovery_percent: { value: 78, confidence: 0.90 },
      smelting_thermal_recovery_percent: { value: 22, confidence: 0.90 }
    }
  },
  
  manufacturing: {
    required: ['manufacturing_process_Casting', 'transport_distance', 'scrap_rate'],
    predictions: {
      manufacturing_energy_MJ_per_t_product: { value: 820, confidence: 0.86 },
      manufacturing_recycled_content_percent: { value: 32, confidence: 0.86 },
      manufacturing_transport_emissions_kgCO2e_per_t: { value: 28, confidence: 0.86 }
    }
  },
  
  recycling: {
    required: ['scrap_input_percentage', 'collection_rate', 'recycling_methods'],
    predictions: {
      recycling_recovery_yield_percent: { value: 88, confidence: 0.84 },
      recycling_energy_kWh_per_t_Al: { value: 1050, confidence: 0.84 },
      recycling_emission_savings_kgCO2e_per_t_Al: { value: 5200, confidence: 0.84 },
      recycling_closed_loop_percent: { value: 65, confidence: 0.84 },
      recycling_open_loop_percent: { value: 35, confidence: 0.84 },
      valorization_recovery_efficiency_percent: { value: 30, confidence: 0.84 }
    }
  },
  
  valorization: {
    required: ['waste_types', 'valorization_methods', 'waste_utilization_percentages'],
    predictions: {
      valorization_recovery_efficiency_percent: { value: 27, confidence: 0.78 },
      valorization_emission_reduction_kgCO2e_per_t_waste: { value: 180, confidence: 0.78 }
    }
  }
};

/**
 * Generate AI predictions for a specific workflow step
 * 
 * @param {string} stepName - Name of the step (mining, beneficiation, etc.)
 * @param {Object} userData - User-provided data for this step
 * @returns {Object} Combined data with predictions
 */
function generatePredictions(stepName, userData) {
  try {
    logger.info(`[AI Prediction] Generating predictions for step: ${stepName}`);
    
    const rules = PREDICTION_RULES[stepName];
    
    if (!rules) {
      throw new Error(`No prediction rules defined for step: ${stepName}`);
    }
    
    // Validate required fields
    const missingFields = rules.required.filter(field => !userData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for prediction: ${missingFields.join(', ')}`);
    }
    
    // Start with user data
    const combinedData = { ...userData };
    const predictedFields = [];
    let totalConfidence = 0;
    let predictionCount = 0;
    
    // Fill in empty fields with predictions
    Object.entries(rules.predictions).forEach(([fieldName, predictionInfo]) => {
      // Only predict if field is empty or undefined
      if (!combinedData[fieldName] && combinedData[fieldName] !== 0) {
        combinedData[fieldName] = predictionInfo.value;
        predictedFields.push(fieldName);
        totalConfidence += predictionInfo.confidence;
        predictionCount++;
        
        logger.info(`[AI Prediction] Predicted ${fieldName} = ${predictionInfo.value} (confidence: ${predictionInfo.confidence})`);
      }
    });
    
    const avgConfidence = predictionCount > 0 ? totalConfidence / predictionCount : 1.0;
    
    return {
      success: true,
      combinedData,
      predictionMetadata: {
        predictedFields,
        confidence: parseFloat(avgConfidence.toFixed(3)),
        predictedCount: predictionCount,
        totalFields: Object.keys(rules.predictions).length
      }
    };
    
  } catch (error) {
    logger.error(`[AI Prediction] Error generating predictions: ${error.message}`);
    throw error;
  }
}

/**
 * Validate if all required fields are present for a step
 * 
 * @param {string} stepName - Name of the step
 * @param {Object} userData - User-provided data
 * @returns {Object} Validation result
 */
function validateRequiredFields(stepName, userData) {
  const rules = PREDICTION_RULES[stepName];
  
  if (!rules) {
    return {
      valid: false,
      error: `No validation rules defined for step: ${stepName}`
    };
  }
  
  logger.info(`[AI Prediction] Validating fields for ${stepName}`);
  logger.info(`[AI Prediction] User data keys: ${Object.keys(userData).join(', ')}`);
  logger.info(`[AI Prediction] Required fields: ${rules.required.join(', ')}`);
  
  const missingFields = rules.required.filter(field => {
    const value = userData[field];
    
    logger.info(`[AI Prediction] Checking field '${field}': value = ${JSON.stringify(value)}, type = ${typeof value}`);
    
    // For arrays, check if array has at least one element
    if (Array.isArray(value)) {
      const isEmpty = value.length === 0;
      logger.info(`[AI Prediction] Field '${field}' is array, isEmpty = ${isEmpty}`);
      return isEmpty;
    }
    
    // For strings, check if not empty
    if (typeof value === 'string') {
      const isEmpty = value.trim() === '';
      logger.info(`[AI Prediction] Field '${field}' is string, isEmpty = ${isEmpty}`);
      return isEmpty;
    }
    
    // For numbers, allow 0 as valid
    if (typeof value === 'number') {
      logger.info(`[AI Prediction] Field '${field}' is number, value = ${value}, valid!`);
      return false;
    }
    
    // For other types, check if undefined or null
    const isMissing = value === undefined || value === null;
    logger.info(`[AI Prediction] Field '${field}' is ${typeof value}, isMissing = ${isMissing}`);
    return isMissing;
  });
  
  if (missingFields.length > 0) {
    logger.warn(`[AI Prediction] Validation failed. Missing fields: ${missingFields.join(', ')}`);
    return {
      valid: false,
      missingFields,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  logger.info(`[AI Prediction] Validation passed! All required fields present.`);
  return {
    valid: true,
    message: 'All required fields are present'
  };
}

/**
 * Get prediction info for a specific step
 * 
 * @param {string} stepName - Name of the step
 * @returns {Object} Prediction info including required fields and predictable fields
 */
function getPredictionInfo(stepName) {
  const rules = PREDICTION_RULES[stepName];
  
  if (!rules) {
    return {
      error: `No prediction rules defined for step: ${stepName}`
    };
  }
  
  return {
    stepName,
    requiredFields: rules.required,
    predictableFields: Object.keys(rules.predictions),
    fieldCount: {
      required: rules.required.length,
      predictable: Object.keys(rules.predictions).length
    }
  };
}

module.exports = {
  generatePredictions,
  validateRequiredFields,
  getPredictionInfo,
  PREDICTION_RULES
};
