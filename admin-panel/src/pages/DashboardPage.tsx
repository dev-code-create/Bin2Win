import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Button, Badge, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaRecycle, 
  FaMapMarkerAlt, 
  FaGift, 
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaLeaf
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import adminApiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DashboardStats } from '../types';
import { formatNumber, formatRelativeTime } from '../utils';

const DashboardPage: React.FC = () => {
  const { admin, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await adminApiService.getDashboardStats(selectedPeriod);
      
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for charts (replace with real data from API)
  const submissionChartData = [
    { name: 'Mon', submissions: 12, approved: 10 },
    { name: 'Tue', submissions: 19, approved: 16 },
    { name: 'Wed', submissions: 15, approved: 13 },
    { name: 'Thu', submissions: 22, approved: 20 },
    { name: 'Fri', submissions: 18, approved: 15 },
    { name: 'Sat', submissions: 25, approved: 23 },
    { name: 'Sun', submissions: 20, approved: 18 },
  ];

  const wasteTypeData = [
    { name: 'Plastic', value: 35, color: '#ff6b6b' },
    { name: 'Organic', value: 25, color: '#51cf66' },
    { name: 'Paper', value: 20, color: '#74c0fc' },
    { name: 'Metal', value: 12, color: '#868e96' },
    { name: 'Glass', value: 8, color: '#20c997' },
  ];

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center">
        <h5>Error Loading Dashboard</h5>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={fetchDashboardData}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-primary text-white border-0">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <h2 className="mb-2">Welcome back, {admin?.fullName}! 👋</h2>
                  <p className="mb-3 opacity-75">
                    Here's what's happening with your waste management system today.
                  </p>
                  <Badge bg="light" text="dark" className="me-2">
                    {admin?.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge bg="warning" text="dark">
                    {admin?.assignedBooths.length || 0} Booths Assigned
                  </Badge>
                </Col>
                <Col md={4} className="text-center">
                  <div className="position-relative">
                    <FaChartLine size={60} className="text-warning" />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Period Selection */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Dashboard Overview</h4>
            <div className="btn-group" role="group">
              {['7d', '30d', '90d'].map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                </Button>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        {hasPermission('users', 'read') && (
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaUsers size={40} className="text-primary mb-3" />
                <h3 className="fw-bold text-primary">{formatNumber(stats?.overview.users.total || 1250)}</h3>
                <p className="text-muted mb-1">Total Users</p>
                <small className="text-success">
                  +{stats?.overview.users.newInPeriod || 45} new this period
                </small>
              </Card.Body>
            </Card>
          </Col>
        )}
        
        {hasPermission('waste', 'read') && (
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaRecycle size={40} className="text-success mb-3" />
                <h3 className="fw-bold text-success">{formatNumber(stats?.overview.submissions.totalInPeriod || 890)}</h3>
                <p className="text-muted mb-1">Submissions</p>
                <small className="text-warning">
                  {stats?.overview.submissions.pending || 23} pending review
                </small>
              </Card.Body>
            </Card>
          </Col>
        )}
        
        {hasPermission('booths', 'read') && (
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaMapMarkerAlt size={40} className="text-info mb-3" />
                <h3 className="fw-bold text-info">{formatNumber(stats?.overview.booths.active || 45)}</h3>
                <p className="text-muted mb-1">Active Booths</p>
                <small className="text-muted">
                  {stats?.overview.booths.total || 52} total booths
                </small>
              </Card.Body>
            </Card>
          </Col>
        )}
        
        {hasPermission('rewards', 'read') && (
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaGift size={40} className="text-warning mb-3" />
                <h3 className="fw-bold text-warning">{formatNumber(stats?.overview.rewards.active || 28)}</h3>
                <p className="text-muted mb-1">Active Rewards</p>
                <small className="text-muted">
                  {stats?.overview.rewards.total || 35} total rewards
                </small>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Row>
        {/* Submissions Chart */}
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 py-3">
              <h5 className="fw-bold mb-0">
                <FaChartLine className="text-primary me-2" />
                Submission Trends
              </h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={submissionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="submissions" 
                    stroke="#0d6efd" 
                    strokeWidth={2}
                    name="Total Submissions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#198754" 
                    strokeWidth={2}
                    name="Approved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions & Alerts */}
        <Col lg={4}>
          {/* System Alerts */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom-0 py-3">
              <h5 className="fw-bold mb-0">
                <FaExclamationTriangle className="text-warning me-2" />
                System Alerts
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-start mb-3">
                <FaClock className="text-warning me-2 mt-1" />
                <div className="flex-grow-1">
                  <small className="fw-bold">Pending Reviews</small>
                  <div className="small text-muted">
                    {stats?.overview.submissions.pending || 23} submissions need review
                  </div>
                </div>
              </div>
              
              <div className="d-flex align-items-start mb-3">
                <FaMapMarkerAlt className="text-info me-2 mt-1" />
                <div className="flex-grow-1">
                  <small className="fw-bold">Booth Status</small>
                  <div className="small text-muted">
                    3 booths near capacity
                  </div>
                </div>
              </div>
              
              <div className="d-flex align-items-start">
                <FaCheckCircle className="text-success me-2 mt-1" />
                <div className="flex-grow-1">
                  <small className="fw-bold">System Health</small>
                  <div className="small text-muted">
                    All systems operational
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom-0 py-3">
              <h5 className="fw-bold mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {hasPermission('waste', 'read') && (
                  <Button as={Link} to="/submissions" variant="outline-primary">
                    <FaRecycle className="me-2" />
                    Review Submissions
                  </Button>
                )}
                {hasPermission('booths', 'create') && (
                  <Button as={Link} to="/booths" variant="outline-success">
                    <FaMapMarkerAlt className="me-2" />
                    Manage Booths
                  </Button>
                )}
                {hasPermission('users', 'read') && (
                  <Button as={Link} to="/users" variant="outline-info">
                    <FaUsers className="me-2" />
                    View Users
                  </Button>
                )}
                {hasPermission('analytics', 'read') && (
                  <Button as={Link} to="/analytics" variant="outline-warning">
                    <FaChartLine className="me-2" />
                    View Analytics
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Waste Type Distribution */}
      <Row className="mt-4">
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 py-3">
              <h5 className="fw-bold mb-0">
                <FaLeaf className="text-success me-2" />
                Waste Type Distribution
              </h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={wasteTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {wasteTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Recent Activity</h5>
                <Button as={Link} to="/submissions" variant="outline-primary" size="sm">
                  View All
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="d-flex align-items-center p-2 bg-light rounded">
                    <FaRecycle className="text-success me-3" />
                    <div className="flex-grow-1">
                      <div className="small fw-bold">
                        {activity.user} submitted {activity.wasteType} waste
                      </div>
                      <div className="small text-muted">
                        {activity.booth} • {formatRelativeTime(activity.date)}
                      </div>
                    </div>
                    <Badge bg={activity.status === 'approved' ? 'success' : 'warning'}>
                      {activity.status}
                    </Badge>
                  </div>
                )) || (
                  // Mock data if no real data
                  <>
                    <div className="d-flex align-items-center p-2 bg-light rounded">
                      <FaRecycle className="text-success me-3" />
                      <div className="flex-grow-1">
                        <div className="small fw-bold">
                          John Doe submitted plastic waste
                        </div>
                        <div className="small text-muted">
                          Booth A1 • 2 hours ago
                        </div>
                      </div>
                      <Badge bg="success">approved</Badge>
                    </div>
                    <div className="d-flex align-items-center p-2 bg-light rounded">
                      <FaRecycle className="text-success me-3" />
                      <div className="flex-grow-1">
                        <div className="small fw-bold">
                          Jane Smith submitted organic waste
                        </div>
                        <div className="small text-muted">
                          Booth B2 • 3 hours ago
                        </div>
                      </div>
                      <Badge bg="warning">pending</Badge>
                    </div>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .space-y-3 > * + * {
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
