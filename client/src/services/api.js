import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // Increased to 30 seconds for slower operations
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 (Unauthorized) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = sessionStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
            { refreshToken }
          );

          if (response.data.success) {
            // Update the access token
            const newAccessToken = response.data.data.accessToken;
            sessionStorage.setItem('accessToken', newAccessToken);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/signup';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
