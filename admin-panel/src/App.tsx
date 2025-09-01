import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Components
import AdminLayout from './components/common/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SubmissionsPage from './pages/SubmissionsPage';
import BoothsPage from './pages/BoothsPage';
import RewardsPage from './pages/RewardsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredPermission={['users', 'read']}>
                  <AdminLayout>
                    <UsersPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/submissions"
              element={
                <ProtectedRoute requiredPermission={['waste', 'read']}>
                  <AdminLayout>
                    <SubmissionsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/booths"
              element={
                <ProtectedRoute requiredPermission={['booths', 'read']}>
                  <AdminLayout>
                    <BoothsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute requiredPermission={['rewards', 'read']}>
                  <AdminLayout>
                    <RewardsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredPermission={['analytics', 'read']}>
                  <AdminLayout>
                    <AnalyticsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredPermission={['system', 'read']}>
                  <AdminLayout>
                    <SettingsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
