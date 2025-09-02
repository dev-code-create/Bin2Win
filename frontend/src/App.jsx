import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UserLoginPage from './pages/UserLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import WasteSubmissionPage from './pages/WasteSubmissionPage';
import RewardStorePage from './pages/RewardStorePage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import BoothLocatorPage from './pages/BoothLocatorPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import RewardDetailsPage from './pages/RewardDetailsPage';
import BoothDetailsPage from './pages/BoothDetailsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import WasteSubmissionManagement from './pages/admin/WasteSubmissionManagement';
import BoothManagement from './pages/admin/BoothManagement';
import RewardsManagement from './pages/admin/RewardsManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AdminSettings from './pages/admin/AdminSettings';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<UserLoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              
              {/* Legacy route redirect */}
              <Route path="/old-login" element={<LoginPage />} />

              {/* Protected Routes - User Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard - Legacy booth operator dashboard */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* New Admin Panel Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout>
                      <UserManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/submissions"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout>
                      <WasteSubmissionManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/booths"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout>
                      <BoothManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/rewards"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout>
                      <RewardsManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout>
                      <AnalyticsDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout>
                      <AdminSettings />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submit-waste"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <WasteSubmissionPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rewards"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RewardStorePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <OrderHistoryPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rewards/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RewardDetailsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booths"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BoothLocatorPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booths/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BoothDetailsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <HistoryPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LeaderboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Redirect /app to dashboard */}
              <Route path="/app" element={<Navigate to="/dashboard" replace />} />

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
    </AppProvider>
  );
}

export default App;
