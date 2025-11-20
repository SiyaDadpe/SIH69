/**
 * LCA Service
 * Frontend service for calling LCA (Life Cycle Assessment) calculation endpoints
 */

import api from './api';

/**
 * Calculate LCA Score and Generate Report
 * @param {Object} data - LCA calculation data
 * @param {string} data.workflowId - The workflow ID (optional)
 * @param {string} data.projectName - The project name (required)
 * @param {string} data.location - The project location (optional)
 * @param {Object} data.wizardData - The wizard form data (stage-wise data)
 * @returns {Promise} Response with report data
 */
export const calculateLCA = async (data) => {
  try {
    console.log('📊 [LCA Service] Initiating LCA calculation...');
    console.log('📊 [LCA Service] Project:', data.projectName);
    console.log('📊 [LCA Service] Workflow ID:', data.workflowId);
    console.log('📊 [LCA Service] Data keys:', Object.keys(data.wizardData || {}));
    
    const response = await api.post('/lca/calculate', data);
    
    console.log('✅ [LCA Service] LCA calculation successful');
    console.log('📄 [LCA Service] Report ID:', response.data.data.reportId);
    console.log('📄 [LCA Service] PDF URL:', response.data.data.pdfUrl);
    
    return response.data;
  } catch (error) {
    console.error('❌ [LCA Service] Error calculating LCA:', error);
    
    // Extract error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to calculate LCA';
    
    throw new Error(errorMessage);
  }
};

/**
 * Get all LCA reports for current user
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of reports per page (default: 20)
 * @param {number} params.page - Page number (default: 1)
 * @param {string} params.status - Filter by status: 'pending', 'completed', 'failed'
 * @returns {Promise} Response with reports and pagination
 */
export const getUserLCAReports = async (params = {}) => {
  try {
    const { limit = 20, page = 1, status } = params;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      ...(status && { status })
    });
    
    const response = await api.get(`/lca/reports?${queryParams}`);
    
    console.log('✅ [LCA Service] Retrieved', response.data.data.reports.length, 'reports');
    
    return response.data;
  } catch (error) {
    console.error('❌ [LCA Service] Error fetching reports:', error);
    throw error;
  }
};

/**
 * Get specific LCA report by ID
 * @param {string} reportId - The report ID
 * @returns {Promise} Response with report data
 */
export const getLCAReportById = async (reportId) => {
  try {
    const response = await api.get(`/lca/reports/${reportId}`);
    
    console.log('✅ [LCA Service] Retrieved report:', reportId);
    
    return response.data;
  } catch (error) {
    console.error('❌ [LCA Service] Error fetching report:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Report not found');
    }
    
    throw error;
  }
};

/**
 * Get LCA statistics for current user
 * @returns {Promise} Response with statistics
 */
export const getUserLCAStats = async () => {
  try {
    const response = await api.get('/lca/stats');
    
    console.log('✅ [LCA Service] Retrieved user LCA stats');
    
    return response.data;
  } catch (error) {
    console.error('❌ [LCA Service] Error fetching stats:', error);
    throw error;
  }
};

/**
 * Delete LCA report
 * @param {string} reportId - The report ID
 * @returns {Promise} Response with success message
 */
export const deleteLCAReport = async (reportId) => {
  try {
    const response = await api.delete(`/lca/reports/${reportId}`);
    
    console.log('✅ [LCA Service] Deleted report:', reportId);
    
    return response.data;
  } catch (error) {
    console.error('❌ [LCA Service] Error deleting report:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Report not found');
    }
    
    throw error;
  }
};

/**
 * Download LCA report PDF
 * @param {string} pdfUrl - The PDF URL
 * @param {string} filename - The filename for download
 */
export const downloadLCAReport = (pdfUrl, filename = 'lca_report.pdf') => {
  try {
    // Construct full URL - remove /api from VITE_API_URL for static file serving
    let fullUrl;
    if (pdfUrl.startsWith('http')) {
      fullUrl = pdfUrl;
    } else {
      // Get base URL without /api suffix
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const baseUrl = apiUrl.replace(/\/api$/, ''); // Remove /api if it exists at the end
      fullUrl = `${baseUrl}${pdfUrl}`;
    }
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📥 [LCA Service] Downloading report from:', fullUrl);
  } catch (error) {
    console.error('❌ [LCA Service] Error downloading report:', error);
    throw error;
  }
};

export default {
  calculateLCA,
  getUserLCAReports,
  getLCAReportById,
  getUserLCAStats,
  deleteLCAReport,
  downloadLCAReport
};
