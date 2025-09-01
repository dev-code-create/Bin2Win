import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading, userType } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login page
    const loginPath = adminOnly ? "/admin/login" : "/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check admin access for admin-only routes
  if (adminOnly && userType !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check user access for user-only routes (prevent admin from accessing user routes)
  if (!adminOnly && userType === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
