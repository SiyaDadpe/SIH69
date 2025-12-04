/**
 * AI Prediction Service
 * Frontend service for calling AI prediction endpoints
 */

import api from './api';

/**
 * Generate AI predictions for a specific workflow step
 * @param {string} workflowId - The workflow ID
 * @param {string} stepName - The step name (mining, beneficiation, etc.)
 * @param {Object} userData - The current form data (user-provided inputs)
 * @returns {Promise} Response with combined data (user + AI predictions)
 */
export const generateStepPrediction = async (workflowId, stepName, userData) => {
  try {
    console.log(`🤖 [AI Prediction] Requesting predictions for ${stepName}...`);
    console.log(`📤 [AI Prediction] Sending user data:`, userData);
    
    const response = await api.post(
      `/wizard/workflows/${workflowId}/steps/${stepName}/predict`,
      userData
    );
    
    console.log(`✅ [AI Prediction] Received response for ${stepName}:`, response.data);
    
    // Check response format and log appropriately
    if (response.data.data?.predictionMetadata) {
      console.log(`📊 [AI Prediction] Predicted ${response.data.data.predictionMetadata.predictedCount} fields`);
      console.log(`🎯 [AI Prediction] Confidence: ${response.data.data.predictionMetadata.confidence}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ [AI Prediction] Error generating predictions for ${stepName}:`, error);
    throw error;
  }
};

/**
 * Get prediction info for a specific step (what fields can be predicted)
 * @param {string} stepName - The step name
 * @returns {Object} Prediction info
 */
export const getPredictionInfo = (stepName) => {
  const predictionMap = {
    mining: {
      requiredFields: ['mining_method', 'mining_ore_grade_percent', 'location'],
      predictableFields: [
        'mining_energy_MJ_per_t_ore',
        'mining_co2_kg_per_t_ore',
        'mining_sox_kg_per_t_ore',
        'mining_nox_kg_per_t_ore',
        'mining_pm_kg_per_t_ore'
      ]
    },
    beneficiation: {
      requiredFields: ['beneficiation_process_Crushing', 'ore_feed_rate', 'location'],
      predictableFields: [
        'beneficiation_water_m3_per_t_ore',
        'beneficiation_electricity_kWh_per_t_ore',
        'beneficiation_tailings_management',
        'beneficiation_noise_pollution',
        'beneficiation_dust_pollution'
      ]
    },
    refining: {
      requiredFields: ['energy_use', 'water_use', 'red_mud_generation'],
      predictableFields: [
        'refining_energy_MJ_per_t_alumina',
        'refining_water_m3_per_t_alumina',
        'refining_red_mud_kg_per_t_alumina',
        'refining_caustic_soda_kg_per_t_alumina',
        'refining_lime_kg_per_t_alumina',
        'refining_so2_kg_per_t_alumina',
        'refining_nox_kg_per_t_alumina',
        'refining_dust_kg_per_t_alumina'
      ]
    },
    smelting: {
      requiredFields: ['electricity_demand', 'co2_emissions', 'cell_technology'],
      predictableFields: [
        'smelting_energy_kWh_per_t_al',
        'smelting_energy_MJ_per_t_al',
        'smelting_co2_kg_per_t_al',
        'smelting_pfc_kg_per_t_al',
        'smelting_so2_kg_per_t_al',
        'smelting_nox_kg_per_t_al',
        'smelting_fluoride_recovery_percent',
        'smelting_thermal_recovery_percent'
      ]
    },
    manufacturing: {
      requiredFields: ['manufacturing_process_Casting', 'transport_distance', 'scrap_rate'],
      predictableFields: [
        'manufacturing_energy_MJ_per_t_product',
        'manufacturing_recycled_content_percent',
        'manufacturing_transport_emissions_kgCO2e_per_t'
      ]
    },
    recycling: {
      requiredFields: ['scrap_input_percentage', 'collection_rate', 'recycling_methods'],
      predictableFields: [
        'recycling_recovery_yield_percent',
        'recycling_energy_kWh_per_t_Al',
        'recycling_emission_savings_kgCO2e_per_t_Al',
        'recycling_closed_loop_percent',
        'recycling_open_loop_percent',
        'valorization_recovery_efficiency_percent'
      ]
    },
    valorization: {
      requiredFields: ['waste_types', 'valorization_methods', 'waste_utilization_percentages'],
      predictableFields: [
        'valorization_recovery_efficiency_percent',
        'valorization_emission_reduction_kgCO2e_per_t_waste'
      ]
    }
  };
  
  return predictionMap[stepName] || null;
};

/**
 * Validate if required fields are filled for AI prediction
 * @param {string} stepName - The step name
 * @param {Object} formData - Current form data (should be in backend field name format)
 * @returns {Object} Validation result {valid: boolean, missingFields: string[]}
 */
export const validateRequiredFields = (stepName, formData) => {
  const info = getPredictionInfo(stepName);
  
  if (!info) {
    return {
      valid: false,
      error: `Unknown step: ${stepName}`,
      missingFields: []
    };
  }
  
  const missingFields = info.requiredFields.filter(field => {
    const value = formData[field];
    // For arrays (like mining_method), check if array has at least one element
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    // For other types, check if value is empty
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields,
      error: `Please fill in required fields: ${missingFields.join(', ')}`
    };
  }
  
  return {
    valid: true,
    missingFields: []
  };
};

/**
 * Fetch existing AI predictions from WizardWorkflowOutput
 * @param {string} workflowId - The workflow ID
 * @returns {Promise} Response with all predictions for the workflow
 */
export const fetchWorkflowPredictions = async (workflowId) => {
  try {
    console.log(`🔍 [AI Prediction] Fetching existing predictions for workflow: ${workflowId}`);
    
    const response = await api.get(
      `/wizard/workflows/${workflowId}/predictions`
    );
    
    console.log(`✅ [AI Prediction] Fetched predictions:`, response.data.data);
    
    return response.data;
  } catch (error) {
    console.error(`❌ [AI Prediction] Error fetching predictions:`, error);
    throw error;
  }
};

/**
 * Poll for predictions with retry logic
 * @param {string} workflowId - The workflow ID
 * @param {number} maxAttempts - Maximum number of polling attempts (default: 15)
 * @param {number} interval - Interval between polls in milliseconds (default: 2000ms)
 * @param {function} onProgress - Callback for progress updates (attempt, maxAttempts)
 * @returns {Promise} Response with predictions or null if timeout
 */
export const pollForPredictions = async (workflowId, maxAttempts = 15, interval = 2000, onProgress = null) => {
  console.log(`🔄 [AI Prediction] Starting to poll for predictions (max ${maxAttempts} attempts, ${interval}ms interval)`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔍 [AI Prediction] Poll attempt ${attempt}/${maxAttempts}`);
      
      // Notify progress
      if (onProgress) {
        onProgress(attempt, maxAttempts);
      }
      
      const response = await fetchWorkflowPredictions(workflowId);
      
      if (response.success && response.data?.hasPredictions) {
        console.log(`✅ [AI Prediction] Predictions found on attempt ${attempt}!`);
        return response;
      }
      
      console.log(`⏳ [AI Prediction] No predictions yet, waiting ${interval}ms before retry...`);
      
      // Wait before next poll (unless it's the last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error(`❌ [AI Prediction] Error during poll attempt ${attempt}:`, error);
      
      // Continue polling even if there's an error (might be temporary)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
  
  console.log(`⏱️ [AI Prediction] Polling timeout after ${maxAttempts} attempts`);
  return null; // Timeout - no predictions found
};

export default {
  generateStepPrediction,
  getPredictionInfo,
  validateRequiredFields,
  fetchWorkflowPredictions,
  pollForPredictions
};
