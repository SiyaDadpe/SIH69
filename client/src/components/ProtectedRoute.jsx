/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */

import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    // Redirect to login page, but save the location they were trying to access
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
