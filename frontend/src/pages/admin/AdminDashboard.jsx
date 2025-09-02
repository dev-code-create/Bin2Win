import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Badge, 
  ProgressBar,
  Table,
  Dropdown,
  ButtonGroup,
  Spinner
} from 'react-bootstrap';
import { 
  FaUsers, 
  FaRecycle, 
  FaMapMarkerAlt, 
  FaGift, 
  FaChartLine, 
  FaCoins,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaDownload,
  FaRedo
} from 'react-icons/fa';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data - replace with API calls
  const mockStats = {
    overview: {
      totalUsers: 15420,
      usersGrowth: 12.5,
      totalSubmissions: 8965,
      submissionsGrowth: 18.3,
      activeBooths: 45,
      boothsGrowth: 5.2,
      totalRewards: 230,
      rewardsGrowth: -2.1,
      totalWasteCollected: 12580, // kg
      wasteGrowth: 22.1,
      creditsDistributed: 89450,
      creditsGrowth: 15.7
    },
    charts: {
      submissionsOverTime: [
        { date: '2024-01-01', submissions: 45, users: 12 },
        { date: '2024-01-02', submissions: 52, users: 18 },
        { date: '2024-01-03', submissions: 38, users: 15 },
        { date: '2024-01-04', submissions: 67, users: 22 },
        { date: '2024-01-05', submissions: 78, users: 28 },
        { date: '2024-01-06', submissions: 85, users: 31 },
        { date: '2024-01-07', submissions: 92, users: 35 }
      ],
      wasteTypeDistribution: [
        { name: 'Plastic', value: 35, color: '#FF6B6B' },
        { name: 'Paper', value: 25, color: '#4ECDC4' },
        { name: 'Metal', value: 20, color: '#45B7D1' },
        { name: 'Glass', value: 12, color: '#96CEB4' },
        { name: 'E-Waste', value: 8, color: '#FECA57' }
      ],
      monthlyGrowth: [
        { month: 'Jan', users: 1200, submissions: 3400, waste: 890 },
        { month: 'Feb', users: 1450, submissions: 3800, waste: 1020 },
        { month: 'Mar', users: 1680, submissions: 4200, waste: 1180 },
        { month: 'Apr', users: 1920, submissions: 4650, waste: 1350 },
        { month: 'May', users: 2180, submissions: 5100, waste: 1520 },
        { month: 'Jun', users: 2450, submissions: 5600, waste: 1720 }
      ]
    },
    recentActivity: [
      { id: 1, type: 'user_registration', user: 'Priya Sharma', time: '2 min ago', status: 'active' },
      { id: 2, type: 'waste_submission', user: 'Rahul Gupta', amount: '2.5kg Plastic', time: '5 min ago', status: 'pending' },
      { id: 3, type: 'reward_redemption', user: 'Anita Desai', reward: 'Eco-friendly Bag', time: '12 min ago', status: 'completed' },
      { id: 4, type: 'booth_alert', booth: 'Booth #12', message: 'Near capacity', time: '18 min ago', status: 'warning' },
      { id: 5, type: 'admin_action', admin: 'Super Admin', action: 'Approved 15 submissions', time: '25 min ago', status: 'info' }
    ],
    alerts: [
      { id: 1, type: 'warning', title: 'Booth Capacity Alert', message: '3 booths are above 85% capacity', priority: 'high' },
      { id: 2, type: 'info', title: 'Pending Submissions', message: '24 submissions awaiting review', priority: 'medium' },
      { id: 3, type: 'success', title: 'System Health', message: 'All systems operating normally', priority: 'low' }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const loadDashboardData = async () => {
      setIsLoading(true);
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(mockStats);
      setIsLoading(false);
    };

    loadDashboardData();
  }, [timeRange]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? 
      <FaArrowUp className="text-success ms-1" /> : 
      <FaArrowDown className="text-danger ms-1" />;
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-success' : 'text-danger';
  };

  const StatCard = ({ title, value, growth, icon: Icon, color = 'primary', suffix = '' }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted small">{title}</div>
            <div className="h3 mb-1">
              {formatNumber(value)}{suffix}
            </div>
            <div className={`small ${getGrowthColor(growth)}`}>
              {Math.abs(growth).toFixed(1)}%
              {getGrowthIcon(growth)}
              <span className="text-muted ms-1">vs last period</span>
            </div>
          </div>
          <div className={`bg-${color} bg-opacity-10 p-3 rounded`}>
            <Icon className={`text-${color}`} size={24} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Dashboard Overview</h2>
          <p className="text-muted mb-0">Welcome back, {user?.fullName || user?.name}</p>
        </div>
        <div className="d-flex gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <FaClock className="me-1" />
              {timeRange === '7d' ? 'Last 7 Days' : 
               timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setTimeRange('7d')}>Last 7 Days</Dropdown.Item>
              <Dropdown.Item onClick={() => setTimeRange('30d')}>Last 30 Days</Dropdown.Item>
              <Dropdown.Item onClick={() => setTimeRange('90d')}>Last 90 Days</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="outline-primary" size="sm">
            <FaDownload className="me-1" />
            Export
          </Button>
          <Button variant="primary" size="sm">
                                <FaRedo className="me-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <Row className="mb-4">
          <Col>
            {stats.alerts.map((alert) => (
              <Alert 
                key={alert.id} 
                variant={alert.type} 
                className="d-flex justify-content-between align-items-center"
                dismissible
              >
                <div>
                  <strong>{alert.title}:</strong> {alert.message}
                </div>
                <Badge bg={alert.priority === 'high' ? 'danger' : alert.priority === 'medium' ? 'warning' : 'info'}>
                  {alert.priority}
                </Badge>
              </Alert>
            ))}
          </Col>
        </Row>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Total Users"
            value={stats.overview.totalUsers}
            growth={stats.overview.usersGrowth}
            icon={FaUsers}
            color="primary"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Submissions"
            value={stats.overview.totalSubmissions}
            growth={stats.overview.submissionsGrowth}
            icon={FaRecycle}
            color="success"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Active Booths"
            value={stats.overview.activeBooths}
            growth={stats.overview.boothsGrowth}
            icon={FaMapMarkerAlt}
            color="info"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Rewards"
            value={stats.overview.totalRewards}
            growth={stats.overview.rewardsGrowth}
            icon={FaGift}
            color="warning"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Waste Collected"
            value={stats.overview.totalWasteCollected}
            growth={stats.overview.wasteGrowth}
            icon={FaChartLine}
            color="danger"
            suffix="kg"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Credits Distributed"
            value={stats.overview.creditsDistributed}
            growth={stats.overview.creditsGrowth}
            icon={FaCoins}
            color="secondary"
          />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        {/* Submissions Over Time */}
        <Col lg={8} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Submissions & Users Over Time</h5>
                <ButtonGroup size="sm">
                  <Button variant="outline-primary" active>Daily</Button>
                  <Button variant="outline-primary">Weekly</Button>
                  <Button variant="outline-primary">Monthly</Button>
                </ButtonGroup>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.charts.submissionsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="submissions" 
                    stackId="1"
                    stroke="#0d6efd" 
                    fill="#0d6efd"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stackId="2"
                    stroke="#198754" 
                    fill="#198754"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Waste Type Distribution */}
        <Col lg={4} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-0">Waste Type Distribution</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.charts.wasteTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.charts.wasteTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly Growth Chart */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-0">Monthly Growth Trends</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.charts.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#0d6efd" name="Users" />
                  <Bar dataKey="submissions" fill="#198754" name="Submissions" />
                  <Bar dataKey="waste" fill="#fd7e14" name="Waste (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity & Quick Actions */}
      <Row>
        {/* Recent Activity */}
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Activity</h5>
              <Button variant="outline-primary" size="sm">
                <FaEye className="me-1" />
                View All
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <tbody>
                  {stats.recentActivity.map((activity) => (
                    <tr key={activity.id}>
                      <td className="border-0 py-3">
                        <div className="d-flex align-items-center">
                          <div className={`badge bg-${
                            activity.status === 'active' ? 'success' :
                            activity.status === 'pending' ? 'warning' :
                            activity.status === 'completed' ? 'primary' :
                            activity.status === 'warning' ? 'danger' : 'info'
                          } me-3`}>
                            {activity.type === 'user_registration' ? <FaUsers /> :
                             activity.type === 'waste_submission' ? <FaRecycle /> :
                             activity.type === 'reward_redemption' ? <FaGift /> :
                             activity.type === 'booth_alert' ? <FaExclamationTriangle /> :
                             <FaCheckCircle />}
                          </div>
                          <div>
                            <div className="fw-medium">
                              {activity.user || activity.booth || activity.admin}
                            </div>
                            <small className="text-muted">
                              {activity.amount || activity.reward || activity.message || activity.action}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="border-0 py-3 text-end">
                        <small className="text-muted">{activity.time}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="primary" className="d-flex justify-content-between align-items-center">
                  <span><FaPlus className="me-2" />Add New User</span>
                </Button>
                <Button variant="success" className="d-flex justify-content-between align-items-center">
                  <span><FaRecycle className="me-2" />Review Submissions</span>
                  <Badge bg="light" text="dark">24</Badge>
                </Button>
                <Button variant="info" className="d-flex justify-content-between align-items-center">
                  <span><FaMapMarkerAlt className="me-2" />Manage Booths</span>
                </Button>
                <Button variant="warning" className="d-flex justify-content-between align-items-center">
                  <span><FaGift className="me-2" />Add Reward</span>
                </Button>
                <Button variant="secondary" className="d-flex justify-content-between align-items-center">
                  <span><FaChartLine className="me-2" />View Analytics</span>
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* System Health */}
          <Card className="border-0 shadow-sm mt-3">
            <Card.Header className="bg-white border-0">
              <h6 className="mb-0">System Health</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Server Performance</small>
                  <small>98%</small>
                </div>
                <ProgressBar variant="success" now={98} />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Database Health</small>
                  <small>95%</small>
                </div>
                <ProgressBar variant="success" now={95} />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>API Response</small>
                  <small>87%</small>
                </div>
                <ProgressBar variant="warning" now={87} />
              </div>
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <small>Storage Usage</small>
                  <small>72%</small>
                </div>
                <ProgressBar variant="info" now={72} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
