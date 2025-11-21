/**
 * AI Prediction Mapping Utility
 * 
 * This utility provides a clean, scalable approach for mapping AI predictions
 * to React Hook Form state. It handles field name mappings, value transformations,
 * and form state updates.
 */

/**
 * Field mapping configuration for different steps
 * Maps frontend form field names to backend API field names
 */
export const STEP_FIELD_MAPPINGS = {
  mining: {
    // Frontend -> Backend
    applicableProcesses: 'mining_method',
    oreGrade: 'mining_ore_grade_percent',
    location: 'location',
    year: 'year',
    overburdenRatio: 'overburdenRatio',
    typeOfEquipment: 'typeOfEquipment',
    waterUsage: 'waterUsage',
    biodiversityImpact: 'biodiversityImpact',
    redMudGeneration: 'redMudGeneration',
    // AI predicted fields changed in backedn
    mining_energy_MJ_per_t_ore: 'mining_energy_MJ_per_t_ore',
    mining_co2_kg_per_t_ore: 'mining_co2_kg_per_t_ore',
    mining_sox_kg_per_t_ore: 'mining_sox_kg_per_t_ore',
    mining_nox_kg_per_t_ore: 'mining_nox_kg_per_t_ore',
    mining_pm_kg_per_t_ore: 'mining_pm_kg_per_t_ore',
  },
  beneficiation: {
    processes: 'beneficiation_process_Crushing',
    oreFeedRate: 'ore_feed_rate',
    location: 'location',
  },
  // Add more step mappings as needed...
};

/**
 * Generate reverse field mappings for a specific step
 * @param {string} stepName - The step name (mining, beneficiation, etc.)
 * @returns {Object} Reverse mapping (backend -> frontend)
 */
export const getReverseFieldMapping = (stepName) => {
  const mapping = STEP_FIELD_MAPPINGS[stepName] || {};
  return Object.entries(mapping).reduce((acc, [frontend, backend]) => {
    acc[backend] = frontend;
    return acc;
  }, {});
};

/**
 * Transform frontend form data to backend format
 * @param {string} stepName - The step name
 * @param {Object} frontendData - Frontend form data
 * @returns {Object} Backend formatted data
 */
export const transformToBackendFormat = (stepName, frontendData) => {
  const fieldMapping = STEP_FIELD_MAPPINGS[stepName] || {};
  const backendData = {};
  
  Object.entries(frontendData).forEach(([frontendKey, value]) => {
    const backendKey = fieldMapping[frontendKey];
    if (backendKey) {
      // Special handling for different data types
      if (frontendKey === 'applicableProcesses' && Array.isArray(value) && value.length > 0) {
        backendData[backendKey] = value[0]; // Take first selected process
      } else if (frontendKey === 'processes' && Array.isArray(value)) {
        // For beneficiation/manufacturing, check if specific process is included
        if (stepName === 'beneficiation') {
          backendData[backendKey] = value.includes('crushing') ? 1 : 0;
        } else if (stepName === 'manufacturing') {
          backendData[backendKey] = value.includes('casting') ? 1 : 0;
        }
      } else {
        backendData[backendKey] = value;
      }
    }
  });
  
  return backendData;
};

/**
 * Map AI predictions from backend response to form fields and update form state
 * @param {string} stepName - The step name
 * @param {Object} backendResponse - AI prediction API response
 * @param {Function} setValue - React Hook Form setValue function
 * @param {Array} predictableFields - List of fields that can be predicted
 * @returns {Object} Mapping result with success status and details
 */
export const mapPredictionsToForm = (stepName, backendResponse, setValue, predictableFields = []) => {
  console.log(`🔄 [AI Prediction] Mapping ${stepName} predictions to form fields...`);
  
  const { data: combinedData, predictionMetadata } = backendResponse;
  const reverseMapping = getReverseFieldMapping(stepName);
  
  // Track successful and failed updates
  const updatedFields = [];
  const failedFields = [];
  
  // Process each predictable field in the backend response
  predictableFields.forEach(backendField => {
    if (combinedData && combinedData.hasOwnProperty(backendField)) {
      const value = combinedData[backendField];
      
      if (value !== undefined && value !== null) {
        try {
          // Get frontend field name (usually same as backend for predicted fields)
          const frontendField = reverseMapping[backendField] || backendField;
          
          // Update form field using setValue
          setValue(frontendField, value, {
            shouldValidate: true, // Trigger validation
            shouldDirty: true,    // Mark field as dirty
            shouldTouch: true     // Mark field as touched
          });
          
          updatedFields.push({ frontendField, backendField, value });
          console.log(`✅ [AI Prediction] Updated ${frontendField} = ${value}`);
        } catch (error) {
          failedFields.push({ 
            backendField, 
            value, 
            error: error.message 
          });
          console.error(`❌ [AI Prediction] Failed to update ${backendField}:`, error);
        }
      }
    }
  });
  
  // Log summary
  console.log(`📊 [AI Prediction] Updated ${updatedFields.length} fields successfully`);
  if (predictionMetadata?.predictedFields) {
    console.log(`🎯 [AI Prediction] Predicted fields: ${predictionMetadata.predictedFields.join(', ')}`);
    console.log(`🎯 [AI Prediction] Confidence: ${predictionMetadata.confidence}`);
  }
  
  if (failedFields.length > 0) {
    console.warn(`⚠️ [AI Prediction] ${failedFields.length} fields failed to update:`, failedFields);
  }
  
  return {
    success: updatedFields.length > 0,
    updatedCount: updatedFields.length,
    failedCount: failedFields.length,
    updatedFields,
    failedFields,
    metadata: predictionMetadata
  };
};

/**
 * Complete AI prediction handler for use in form components
 * @param {string} stepName - The step name
 * @param {string} workflowId - The workflow ID
 * @param {Object} formInstance - React Hook Form instance
 * @param {Function} generateStepPrediction - AI prediction service function
 * @param {Function} getPredictionInfo - Function to get predictable fields info
 * @param {Object} statusSetters - Functions to set success/error states
 * @returns {Function} AI prediction handler function
 */
export const createAIPredictionHandler = (
  stepName,
  workflowId,
  formInstance,
  generateStepPrediction,
  getPredictionInfo,
  statusSetters = {}
) => {
  const { setSaveSuccess, setSaveError } = statusSetters;
  
  return async () => {
    console.log(`🤖 [AI Prediction] Button clicked for step: ${stepName}`);
    
    try {
      // Get current form data
      const currentFormData = formInstance.getValues();
      console.log('🤖 [AI Prediction] Current form data (frontend):', currentFormData);
      
      // Transform to backend format
      const backendFormData = transformToBackendFormat(stepName, currentFormData);
      console.log('🔄 [AI Prediction] Transformed data (backend format):', backendFormData);
      
      // Call AI prediction service
      const response = await generateStepPrediction(workflowId, stepName, backendFormData);
      console.log('✅ [AI Prediction] Received response:', response);
      
      // Get predictable fields for this step
      const info = getPredictionInfo(stepName);
      const predictableFields = info?.predictableFields || [];
      
      // Map predictions to form fields
      const mapResult = mapPredictionsToForm(
        stepName,
        response.data || response,
        formInstance.setValue,
        predictableFields
      );
      
      if (mapResult.success) {
        setSaveSuccess?.(true);
        setSaveError?.(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess?.(false), 3000);
        
        return {
          success: true,
          message: `Successfully updated ${mapResult.updatedCount} fields with AI predictions`,
          ...mapResult
        };
      } else {
        throw new Error('No fields were updated with predictions');
      }
      
    } catch (error) {
      console.error('❌ [AI Prediction] Error generating predictions:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate AI predictions';
      setSaveError?.(`AI Prediction Error: ${errorMessage}`);
      setSaveSuccess?.(false);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };
};

/**
 * Utility to add predictable fields to a Zod schema
 * @param {Object} baseSchema - Base Zod schema
 * @param {Array} predictableFields - List of predictable field names
 * @returns {Object} Extended schema with predictable fields
 */
export const addPredictableFieldsToSchema = (baseSchema, predictableFields = []) => {
  const predictableFieldSchema = predictableFields.reduce((acc, fieldName) => {
    acc[fieldName] = z.coerce.number().optional();
    return acc;
  }, {});
  
  return baseSchema.extend(predictableFieldSchema);
};

export default {
  STEP_FIELD_MAPPINGS,
  getReverseFieldMapping,
  transformToBackendFormat,
  mapPredictionsToForm,
  createAIPredictionHandler,
  addPredictableFieldsToSchema
};