import api from './api';

export const dashboardService = {
  /**
   * Get dashboard data with KPIs, recent projects, and insights
   * @returns {Promise} Dashboard data
   */
  getDashboard: async () => {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  /**
   * Get user insights with optional filtering
   * @param {Object} params - Query parameters (priority, type, limit)
   * @returns {Promise} Insights data
   */
  getInsights: async (params = {}) => {
    try {
      const response = await api.get('/dashboard/insights', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  },

  /**
   * Get monthly trends
   * @param {number} months - Number of months to fetch
   * @returns {Promise} Trends data
   */
  getTrends: async (months = 6) => {
    try {
      const response = await api.get('/dashboard/trends', { params: { months } });
      return response.data;
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw error;
    }
  },

  /**
   * Get performance summary
   * @returns {Promise} Performance data
   */
  getPerformance: async () => {
    try {
      const response = await api.get('/dashboard/performance');
      return response.data;
    } catch (error) {
      console.error('Error fetching performance:', error);
      throw error;
    }
  }
};

export default dashboardService;
