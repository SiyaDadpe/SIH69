import api from './api';

// ==================== WIZARD WORKFLOW CRUD ====================

/**
 * Create a new wizard workflow
 * @param {Object} data - { name, metalType, userId, description }
 * @returns {Promise} Response with created workflow
 */
export const createWizardWorkflow = async (data) => {
  try {
    const response = await api.post('/wizard/workflows', data);
    return response.data;
  } catch (error) {
    console.error('Error creating wizard workflow:', error);
    throw error;
  }
};

/**
 * Get all wizard workflows with optional filters
 * @param {Object} params - { userId, metalType, status, isPublic, page, limit }
 * @returns {Promise} Response with workflows list
 */
export const getWizardWorkflows = async (params = {}) => {
  try {
    const response = await api.get('/wizard/workflows', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching wizard workflows:', error);
    throw error;
  }
};

/**
 * Get a single wizard workflow by ID
 * @param {string} id - Workflow ID
 * @returns {Promise} Response with workflow details
 */
export const getWizardWorkflow = async (id) => {
  try {
    const response = await api.get(`/wizard/workflows/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wizard workflow:', error);
    throw error;
  }
};

/**
 * Update wizard workflow metadata
 * @param {string} id - Workflow ID
 * @param {Object} data - { name, description, metalType, isPublic }
 * @returns {Promise} Response with updated workflow
 */
export const updateWizardWorkflow = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating wizard workflow:', error);
    throw error;
  }
};

/**
 * Delete a wizard workflow
 * @param {string} id - Workflow ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteWizardWorkflow = async (id) => {
  try {
    const response = await api.delete(`/wizard/workflows/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting wizard workflow:', error);
    throw error;
  }
};

// ==================== STEP UPDATE FUNCTIONS ====================

/**
 * Update Mining Step (Step 0)
 * @param {string} id - Workflow ID
 * @param {Object} data - Mining step data
 * @returns {Promise} Response with updated workflow
 */
export const updateMiningStep = async (id, data) => {
  try {
    console.log('🚀 [Frontend] Sending mining step data:', {
      workflowId: id,
      dataKeys: Object.keys(data),
      data: data
    });
    const response = await api.put(`/wizard/workflows/${id}/steps/mining`, data);
    console.log('✅ [Frontend] Mining step response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error updating mining step:', error);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};

/**
 * Update Beneficiation Step (Step 1)
 * @param {string} id - Workflow ID
 * @param {Object} data - Beneficiation step data
 * @returns {Promise} Response with updated workflow
 */
export const updateBeneficiationStep = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}/steps/beneficiation`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating beneficiation step:', error);
    throw error;
  }
};

/**
 * Update Refining Step (Step 2)
 * @param {string} id - Workflow ID
 * @param {Object} data - Refining step data
 * @returns {Promise} Response with updated workflow
 */
export const updateRefiningStep = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}/steps/refining`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating refining step:', error);
    throw error;
  }
};

/**
 * Update Smelting Step (Step 3)
 * @param {string} id - Workflow ID
 * @param {Object} data - Smelting step data
 * @returns {Promise} Response with updated workflow
 */
export const updateSmeltingStep = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}/steps/smelting`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating smelting step:', error);
    throw error;
  }
};

/**
 * Update Ironmaking Step (Step 3 - Steel)
 * @param {string} id - Workflow ID
 * @param {Object} data - Ironmaking step data
 * @returns {Promise} Response with updated workflow
 */
export const updateIronmakingStep = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}/steps/ironmaking`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating ironmaking step:', error);
    throw error;
  }
};

/**
 * Update Steelmaking Step (Step 4 - Steel)
 * @param {string} id - Workflow ID
 * @param {Object} data - Steelmaking step data
 * @returns {Promise} Response with updated workflow
 */
export const updateSteelmakingStep = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}/steps/steelmaking`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating steelmaking step:', error);
    throw error;
  }
};

/**
 * Update Manufacturing Step (Step 4)
 * @param {string} id - Workflow ID
 * @param {Object} data - Manufacturing step data
 * @returns {Promise} Response with updated workflow
 */
export const updateManufacturingStep = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}/steps/manufacturing`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating manufacturing step:', error);
    throw error;
  }
};

/**
 * Update Recycling Step (Step 5)
 * @param {string} id - Workflow ID
 * @param {Object} data - Recycling step data
 * @returns {Promise} Response with updated workflow
 */
export const updateRecyclingStep = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}/steps/recycling`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating recycling step:', error);
    throw error;
  }
};

/**
 * Update Valorization Step (Step 6)
 * @param {string} id - Workflow ID
 * @param {Object} data - Valorization step data
 * @returns {Promise} Response with updated workflow
 */
export const updateValorizationStep = async (id, data) => {
  try {
    const response = await api.put(`/wizard/workflows/${id}/steps/valorization`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating valorization step:', error);
    throw error;
  }
};

// ==================== STEP COMPLETION FUNCTIONS ====================

/**
 * Mark a step as complete
 * @param {string} id - Workflow ID
 * @param {string} stepName - 'mining' | 'beneficiation' | 'refining' | 'smelting' | 'manufacturing' | 'recycling' | 'valorization'
 * @returns {Promise} Response with updated workflow
 */
export const completeStep = async (id, stepName) => {
  try {
    const response = await api.post(`/wizard/workflows/${id}/steps/${stepName}/complete`);
    return response.data;
  } catch (error) {
    console.error(`Error completing ${stepName} step:`, error);
    throw error;
  }
};

// ==================== WORKFLOW SUBMISSION ====================

/**
 * Submit a completed wizard workflow (requires 100% completion)
 * @param {string} id - Workflow ID
 * @returns {Promise} Response confirming submission
 */
export const submitWizardWorkflow = async (id) => {
  try {
    const response = await api.post(`/wizard/workflows/${id}/submit`);
    return response.data;
  } catch (error) {
    console.error('Error submitting wizard workflow:', error);
    throw error;
  }
};

// ==================== REPORT GENERATION ====================

/**
 * Generate and save a report from wizard workflow
 * @param {string} id - Workflow ID
 * @returns {Promise} Response with generated report
 */
export const generateWizardReport = async (id) => {
  try {
    const response = await api.post(`/wizard/workflows/${id}/generate-report`);
    return response.data;
  } catch (error) {
    console.error('Error generating wizard report:', error);
    throw error;
  }
};

// ==================== STATISTICS ====================

/**
 * Get wizard workflow statistics
 * @param {string} userId - Optional user ID to filter statistics
 * @returns {Promise} Response with statistics
 */
export const getWizardStatistics = async (userId = null) => {
  try {
    const params = userId ? { userId } : {};
    const response = await api.get('/wizard/statistics', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching wizard statistics:', error);
    throw error;
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get user's wizard workflows
 * @param {string} userId - User ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise} Response with user's workflows
 */
export const getUserWizardWorkflows = async (userId, params = {}) => {
  try {
    const response = await api.get(`/wizard/users/${userId}/workflows`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching user wizard workflows:', error);
    throw error;
  }
};

/**
 * Get public wizard workflows
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise} Response with public workflows
 */
export const getPublicWizardWorkflows = async (params = {}) => {
  try {
    const response = await api.get('/wizard/workflows/public', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching public wizard workflows:', error);
    throw error;
  }
};

// ==================== COMBINED STEP UPDATE HELPER ====================

/**
 * Update any step by name with validation
 * @param {string} id - Workflow ID
 * @param {string} stepName - Step name
 * @param {Object} data - Step data
 * @returns {Promise} Response with updated workflow
 */
export const updateStep = async (id, stepName, data) => {
  const stepFunctions = {
    mining: updateMiningStep,
    beneficiation: updateBeneficiationStep,
    refining: updateRefiningStep,
    smelting: updateSmeltingStep,
    manufacturing: updateManufacturingStep,
    recycling: updateRecyclingStep,
    valorization: updateValorizationStep,
  };

  const updateFunction = stepFunctions[stepName];
  if (!updateFunction) {
    throw new Error(`Invalid step name: ${stepName}`);
  }

  return updateFunction(id, data);
};

// ==================== WORKFLOW COMPLETION HELPER ====================

/**
 * Save and complete a step in one call
 * @param {string} id - Workflow ID
 * @param {string} stepName - Step name
 * @param {Object} data - Step data
 * @returns {Promise} Response with updated workflow after completion
 */
export const saveAndCompleteStep = async (id, stepName, data) => {
  try {
    // First update the step with data
    await updateStep(id, stepName, data);
    
    // Then mark it as complete
    const response = await completeStep(id, stepName);
    return response;
  } catch (error) {
    console.error(`Error saving and completing ${stepName} step:`, error);
    throw error;
  }
};

// Export all functions as default object as well
export default {
  createWizardWorkflow,
  getWizardWorkflows,
  getWizardWorkflow,
  updateWizardWorkflow,
  deleteWizardWorkflow,
  updateMiningStep,
  updateBeneficiationStep,
  updateRefiningStep,
  updateSmeltingStep,
  updateIronmakingStep,
  updateSteelmakingStep,
  updateManufacturingStep,
  updateRecyclingStep,
  updateValorizationStep,
  completeStep,
  submitWizardWorkflow,
  generateWizardReport,
  getWizardStatistics,
  getUserWizardWorkflows,
  getPublicWizardWorkflows,
  updateStep,
  saveAndCompleteStep,
};