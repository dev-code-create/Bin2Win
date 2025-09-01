import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Alert } from 'react-bootstrap';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: [string, string]; // [module, action]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { admin, isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if admin account is active
  if (!admin?.isActive) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger" className="text-center">
          <h5>Account Inactive</h5>
          <p>Your admin account has been deactivated. Please contact the system administrator.</p>
        </Alert>
      </div>
    );
  }

  // Check required permissions
  if (requiredPermission) {
    const [module, action] = requiredPermission;
    if (!hasPermission(module, action)) {
      return (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <Alert variant="warning" className="text-center">
            <h5>Access Denied</h5>
            <p>You don't have permission to access this section.</p>
            <p className="small text-muted">
              Required permission: {module}:{action}
            </p>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
