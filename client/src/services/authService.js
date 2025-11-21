/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import api from './api';

/**
 * Clear all wizard and application data from localStorage
 * This ensures a fresh state for each login session
 */
const clearWizardData = () => {
  // Clear wizard workflow
  localStorage.removeItem('currentWizardWorkflowId');
  localStorage.removeItem('userId');
  
  // Clear canvas state
  localStorage.removeItem('canvasStateRF');
  
  // Clear report filters
  const reportKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('reportFilters_') || key === 'defaultReportFilter'
  );
  reportKeys.forEach(key => localStorage.removeItem(key));
  
  console.log('🧹 Wizard and application data cleared');
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - Full name
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Password
 * @param {string} userData.organization - Organization name
 * @param {string} userData.role - User role
 * @returns {Promise<Object>} Registration response
 */
export const register = async (userData) => {
  try {
    // Clear any existing wizard/application data before registration
    clearWizardData();
    
    const response = await api.post('/auth/register', userData);
    
    // Store tokens in sessionStorage (clears on browser close)
    if (response.data.success && response.data.data.accessToken) {
      sessionStorage.setItem('accessToken', response.data.data.accessToken);
      sessionStorage.setItem('refreshToken', response.data.data.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      console.log('✅ User registered successfully with fresh session');
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      // Request made but no response - server not running
      throw { 
        success: false, 
        message: 'Cannot connect to server. Please make sure the backend server is running on port 5000.' 
      };
    } else {
      // Something else went wrong
      throw { success: false, message: error.message || 'Registration failed' };
    }
  }
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email address
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} Login response
 */
export const login = async (credentials) => {
  try {
    // Clear any existing wizard/application data from previous sessions
    clearWizardData();
    
    const response = await api.post('/auth/login', credentials);
    
    // Store tokens in sessionStorage (clears on browser close)
    if (response.data.success && response.data.data.accessToken) {
      sessionStorage.setItem('accessToken', response.data.data.accessToken);
      sessionStorage.setItem('refreshToken', response.data.data.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      console.log('✅ User logged in successfully with fresh session');
    }
    
    return response.data;
  } catch (error) {
    // Better error handling
    if (error.response) {
      // Server responded with error
      throw error.response.data;
    } else if (error.request) {
      // Request made but no response - server not running
      throw { 
        success: false, 
        message: 'Cannot connect to server. Please make sure the backend server is running on port 5000.' 
      };
    } else {
      // Something else went wrong
      throw { success: false, message: error.message || 'Login failed' };
    }
  }
};

/**
 * Logout user
 * Clears all stored tokens, user data, and application state
 */
export const logout = () => {
  // Clear session storage (auth tokens and user data)
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  
  // Clear localStorage wizard and application data
  clearWizardData();
  
  console.log('✅ User logged out - all session data cleared');
  
  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Get current user from sessionStorage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const token = sessionStorage.getItem('accessToken');
  const user = getCurrentUser();
  return !!(token && user);
};

/**
 * Get user profile
 * @returns {Promise<Object>} User profile data
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    
    // Update stored user data
    if (response.data.success && response.data.data) {
      sessionStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch profile' };
  }
};

/**
 * Refresh access token
 * @returns {Promise<Object>} New access token
 */
export const refreshToken = async () => {
  try {
    const refreshToken = sessionStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/refresh-token', { refreshToken });
    
    // Update access token
    if (response.data.success && response.data.data.accessToken) {
      sessionStorage.setItem('accessToken', response.data.data.accessToken);
    }
    
    return response.data;
  } catch (error) {
    // If refresh fails, logout user
    logout();
    throw error.response?.data || { success: false, message: 'Session expired' };
  }
};

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (updates) => {
  try {
    const response = await api.put('/auth/profile', updates);
    
    // Update stored user data
    if (response.data.success && response.data.data) {
      sessionStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update profile' };
  }
};

/**
 * Change password
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} Response
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to change password' };
  }
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getProfile,
  refreshToken,
  updateProfile,
  changePassword
};
