import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  ButtonGroup,
  Dropdown,
  Alert,
  Spinner,
  Table,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import {
  FaChartLine,
  FaDownload,
  FaFilter,
  FaCalendar,
  FaUsers,
  FaRecycle,
  FaMapMarkerAlt,
  FaGift,
  FaCoins,
  FaArrowUp,
  FaArrowDown,
  FaTrendingUp,
  FaTrendingDown,
  FaEye,
  FaPrint,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

const AnalyticsDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("users");
  const [analyticsData, setAnalyticsData] = useState(null);

  // Mock analytics data - replace with API calls
  const mockAnalyticsData = {
    overview: {
      totalUsers: 15420,
      usersGrowth: 12.5,
      activeUsers: 8950,
      activeUsersGrowth: 18.3,
      totalSubmissions: 45670,
      submissionsGrowth: 22.1,
      totalWasteCollected: 125800, // kg
      wasteGrowth: 28.7,
      totalCreditsDistributed: 456780,
      creditsGrowth: 15.4,
      totalRedemptions: 2340,
      redemptionsGrowth: 9.8,
    },
    userGrowth: [
      {
        date: "2024-01-01",
        newUsers: 125,
        totalUsers: 12000,
        activeUsers: 7800,
      },
      {
        date: "2024-01-02",
        newUsers: 143,
        totalUsers: 12143,
        activeUsers: 7950,
      },
      {
        date: "2024-01-03",
        newUsers: 167,
        totalUsers: 12310,
        activeUsers: 8100,
      },
      {
        date: "2024-01-04",
        newUsers: 189,
        totalUsers: 12499,
        activeUsers: 8250,
      },
      {
        date: "2024-01-05",
        newUsers: 156,
        totalUsers: 12655,
        activeUsers: 8400,
      },
      {
        date: "2024-01-06",
        newUsers: 198,
        totalUsers: 12853,
        activeUsers: 8600,
      },
      {
        date: "2024-01-07",
        newUsers: 234,
        totalUsers: 13087,
        activeUsers: 8800,
      },
    ],
    wasteAnalytics: [
      {
        month: "Jan",
        plastic: 3200,
        paper: 2100,
        metal: 1800,
        glass: 900,
        organic: 1200,
        electronic: 400,
      },
      {
        month: "Feb",
        plastic: 3600,
        paper: 2300,
        metal: 2000,
        glass: 1100,
        organic: 1400,
        electronic: 500,
      },
      {
        month: "Mar",
        plastic: 4100,
        paper: 2600,
        metal: 2200,
        glass: 1200,
        organic: 1600,
        electronic: 600,
      },
      {
        month: "Apr",
        plastic: 4500,
        paper: 2800,
        metal: 2400,
        glass: 1400,
        organic: 1800,
        electronic: 700,
      },
      {
        month: "May",
        plastic: 4900,
        paper: 3100,
        metal: 2600,
        glass: 1500,
        organic: 2000,
        electronic: 800,
      },
      {
        month: "Jun",
        plastic: 5300,
        paper: 3400,
        metal: 2800,
        glass: 1700,
        organic: 2200,
        electronic: 900,
      },
    ],
    regionAnalytics: [
      {
        region: "North Delhi",
        users: 3420,
        submissions: 8900,
        waste: 28500,
        booths: 12,
      },
      {
        region: "South Delhi",
        users: 2890,
        submissions: 7650,
        waste: 24200,
        booths: 10,
      },
      {
        region: "Mumbai",
        users: 4200,
        submissions: 11200,
        waste: 35600,
        booths: 15,
      },
      {
        region: "Bangalore",
        users: 3100,
        submissions: 8300,
        waste: 26400,
        booths: 11,
      },
      {
        region: "Pune",
        users: 1810,
        submissions: 4920,
        waste: 15600,
        booths: 7,
      },
    ],
    userEngagement: [
      { name: "Daily Active", value: 68, color: "#0088FE" },
      { name: "Weekly Active", value: 85, color: "#00C49F" },
      { name: "Monthly Active", value: 58, color: "#FFBB28" },
      { name: "Inactive", value: 15, color: "#FF8042" },
    ],
    submissionTrends: [
      { time: "00:00", submissions: 45 },
      { time: "04:00", submissions: 23 },
      { time: "08:00", submissions: 189 },
      { time: "12:00", submissions: 267 },
      { time: "16:00", submissions: 234 },
      { time: "20:00", submissions: 156 },
    ],
    topPerformers: {
      users: [
        {
          id: 1,
          name: "Priya Sharma",
          submissions: 234,
          waste: 456.7,
          credits: 4560,
        },
        {
          id: 2,
          name: "Rajesh Kumar",
          submissions: 189,
          waste: 378.2,
          credits: 3890,
        },
        {
          id: 3,
          name: "Anita Desai",
          submissions: 167,
          waste: 334.5,
          credits: 3450,
        },
        {
          id: 4,
          name: "Vikash Singh",
          submissions: 145,
          waste: 289.3,
          credits: 2980,
        },
        {
          id: 5,
          name: "Sunita Gupta",
          submissions: 134,
          waste: 267.8,
          credits: 2780,
        },
      ],
      booths: [
        {
          id: 1,
          name: "Booth #12 - Sector 15",
          submissions: 1890,
          waste: 4567.8,
          utilization: 89,
        },
        {
          id: 2,
          name: "Booth #8 - MG Road",
          submissions: 1670,
          waste: 3890.2,
          utilization: 78,
        },
        {
          id: 3,
          name: "Booth #25 - Banjara Hills",
          submissions: 1450,
          waste: 3456.7,
          utilization: 67,
        },
        {
          id: 4,
          name: "Booth #7 - Koramangala",
          submissions: 1340,
          waste: 3234.5,
          utilization: 85,
        },
        {
          id: 5,
          name: "Booth #19 - CP",
          submissions: 1230,
          waste: 2890.3,
          utilization: 72,
        },
      ],
    },
    environmentalImpact: {
      carbonSaved: 12500, // kg CO2
      treesEquivalent: 234,
      energySaved: 45600, // kWh
      waterSaved: 89000, // liters
      landfillDiverted: 125800, // kg
    },
  };

  useEffect(() => {
    // Simulate API call
    const loadAnalytics = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAnalyticsData(mockAnalyticsData);
      setIsLoading(false);
    };

    loadAnalytics();
  }, [dateRange]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? (
      <FaArrowUp className="text-success ms-1" />
    ) : (
      <FaArrowDown className="text-danger ms-1" />
    );
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? "text-success" : "text-danger";
  };

  const StatCard = ({
    title,
    value,
    growth,
    icon: Icon,
    color = "primary",
    suffix = "",
  }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted small">{title}</div>
            <div className="h3 mb-1">
              {formatNumber(value)}
              {suffix}
            </div>
            <div className={`small ${getGrowthColor(growth)}`}>
              {Math.abs(growth).toFixed(1)}%{getGrowthIcon(growth)}
              <span className="text-muted ms-1">vs last period</span>
            </div>
          </div>
          <div className={`bg-${color} bg-opacity-10 p-3 rounded`}>
            <Icon className={`text-${color}`} size={20} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Analytics Dashboard</h2>
          <p className="text-muted mb-0">Comprehensive insights and reports</p>
        </div>
        <div className="d-flex gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <FaCalendar className="me-1" />
              {dateRange === "7d"
                ? "Last 7 Days"
                : dateRange === "30d"
                ? "Last 30 Days"
                : dateRange === "90d"
                ? "Last 90 Days"
                : "Last Year"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setDateRange("7d")}>
                Last 7 Days
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setDateRange("30d")}>
                Last 30 Days
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setDateRange("90d")}>
                Last 90 Days
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setDateRange("1y")}>
                Last Year
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="outline-primary" size="sm">
            <FaDownload className="me-1" />
            Export Report
          </Button>
          <Button variant="outline-secondary" size="sm">
            <FaPrint className="me-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Total Users"
            value={analyticsData.overview.totalUsers}
            growth={analyticsData.overview.usersGrowth}
            icon={FaUsers}
            color="primary"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Active Users"
            value={analyticsData.overview.activeUsers}
            growth={analyticsData.overview.activeUsersGrowth}
            icon={FaUsers}
            color="success"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Submissions"
            value={analyticsData.overview.totalSubmissions}
            growth={analyticsData.overview.submissionsGrowth}
            icon={FaRecycle}
            color="info"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Waste Collected"
            value={analyticsData.overview.totalWasteCollected}
            growth={analyticsData.overview.wasteGrowth}
            icon={FaChartLine}
            color="warning"
            suffix="kg"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Credits Distributed"
            value={analyticsData.overview.totalCreditsDistributed}
            growth={analyticsData.overview.creditsGrowth}
            icon={FaCoins}
            color="danger"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Redemptions"
            value={analyticsData.overview.totalRedemptions}
            growth={analyticsData.overview.redemptionsGrowth}
            icon={FaGift}
            color="secondary"
          />
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row className="mb-4">
        {/* User Growth Trends */}
        <Col lg={8} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">User Growth Trends</h5>
                <ButtonGroup size="sm">
                  <Button
                    variant={
                      selectedMetric === "users" ? "primary" : "outline-primary"
                    }
                    onClick={() => setSelectedMetric("users")}
                  >
                    New Users
                  </Button>
                  <Button
                    variant={
                      selectedMetric === "active"
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() => setSelectedMetric("active")}
                  >
                    Active Users
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newUsers" fill="#0d6efd" name="New Users" />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#198754"
                    name="Active Users"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* User Engagement */}
        <Col lg={4} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-0">User Engagement</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart data={analyticsData.userEngagement}>
                  <RadialBar
                    minAngle={15}
                    label={{ position: "insideStart", fill: "#fff" }}
                    background
                    clockWise
                    dataKey="value"
                  />
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    align="right"
                    verticalAlign="top"
                  />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row className="mb-4">
        {/* Waste Type Analytics */}
        <Col lg={8} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-0">Waste Collection by Type</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.wasteAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="plastic"
                    stackId="1"
                    stroke="#FF6B6B"
                    fill="#FF6B6B"
                  />
                  <Area
                    type="monotone"
                    dataKey="paper"
                    stackId="1"
                    stroke="#4ECDC4"
                    fill="#4ECDC4"
                  />
                  <Area
                    type="monotone"
                    dataKey="metal"
                    stackId="1"
                    stroke="#45B7D1"
                    fill="#45B7D1"
                  />
                  <Area
                    type="monotone"
                    dataKey="glass"
                    stackId="1"
                    stroke="#96CEB4"
                    fill="#96CEB4"
                  />
                  <Area
                    type="monotone"
                    dataKey="organic"
                    stackId="1"
                    stroke="#FECA57"
                    fill="#FECA57"
                  />
                  <Area
                    type="monotone"
                    dataKey="electronic"
                    stackId="1"
                    stroke="#FF9FF3"
                    fill="#FF9FF3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Submission Timeline */}
        <Col lg={4} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-0">Daily Submission Pattern</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.submissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="submissions" fill="#0d6efd" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Regional Analytics */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Regional Performance</h5>
              <Button variant="outline-primary" size="sm">
                <FaEye className="me-1" />
                View Map
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0">Region</th>
                    <th className="border-0">Users</th>
                    <th className="border-0">Submissions</th>
                    <th className="border-0">Waste Collected</th>
                    <th className="border-0">Active Booths</th>
                    <th className="border-0">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.regionAnalytics.map((region, index) => (
                    <tr key={index}>
                      <td className="border-0 py-3">
                        <div className="d-flex align-items-center">
                          <FaMapMarkerAlt className="text-primary me-2" />
                          <strong>{region.region}</strong>
                        </div>
                      </td>
                      <td className="border-0 py-3">
                        {region.users.toLocaleString()}
                      </td>
                      <td className="border-0 py-3">
                        {region.submissions.toLocaleString()}
                      </td>
                      <td className="border-0 py-3">
                        {region.waste.toLocaleString()}kg
                      </td>
                      <td className="border-0 py-3">{region.booths}</td>
                      <td className="border-0 py-3">
                        <div className="d-flex align-items-center">
                          <ProgressBar
                            now={(region.submissions / 12000) * 100}
                            variant="success"
                            style={{ width: "100px" }}
                            className="me-2"
                          />
                          <small className="text-muted">
                            {Math.round((region.submissions / 12000) * 100)}%
                          </small>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Environmental Impact & Top Performers */}
      <Row className="mb-4">
        {/* Environmental Impact */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Environmental Impact</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={6} className="mb-3">
                  <div className="text-center">
                    <div className="h3 text-success mb-1">
                      {analyticsData.environmentalImpact.carbonSaved.toLocaleString()}
                      kg
                    </div>
                    <small className="text-muted">CO₂ Emissions Saved</small>
                  </div>
                </Col>
                <Col sm={6} className="mb-3">
                  <div className="text-center">
                    <div className="h3 text-success mb-1">
                      {analyticsData.environmentalImpact.treesEquivalent}
                    </div>
                    <small className="text-muted">Trees Worth Impact</small>
                  </div>
                </Col>
                <Col sm={6} className="mb-3">
                  <div className="text-center">
                    <div className="h3 text-info mb-1">
                      {analyticsData.environmentalImpact.energySaved.toLocaleString()}
                      kWh
                    </div>
                    <small className="text-muted">Energy Saved</small>
                  </div>
                </Col>
                <Col sm={6} className="mb-3">
                  <div className="text-center">
                    <div className="h3 text-primary mb-1">
                      {analyticsData.environmentalImpact.waterSaved.toLocaleString()}
                      L
                    </div>
                    <small className="text-muted">Water Saved</small>
                  </div>
                </Col>
              </Row>
              <Alert variant="success" className="mt-3 mb-0">
                <strong>Impact Summary:</strong> Your platform has diverted{" "}
                <strong>
                  {analyticsData.environmentalImpact.landfillDiverted.toLocaleString()}
                  kg
                </strong>{" "}
                of waste from landfills!
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        {/* Top Performers */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Top Performers</h5>
                <ButtonGroup size="sm">
                  <Button variant="outline-primary">Users</Button>
                  <Button variant="outline-primary">Booths</Button>
                </ButtonGroup>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive className="mb-0">
                <thead className="border-0">
                  <tr>
                    <th className="border-0 text-muted small">Rank</th>
                    <th className="border-0 text-muted small">Name</th>
                    <th className="border-0 text-muted small">Submissions</th>
                    <th className="border-0 text-muted small">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topPerformers.users
                    .slice(0, 5)
                    .map((user, index) => (
                      <tr key={user.id}>
                        <td className="border-0 py-2">
                          <Badge bg={index < 3 ? "warning" : "secondary"}>
                            #{index + 1}
                          </Badge>
                        </td>
                        <td className="border-0 py-2">
                          <div className="fw-medium">{user.name}</div>
                        </td>
                        <td className="border-0 py-2">{user.submissions}</td>
                        <td className="border-0 py-2">
                          <div className="d-flex align-items-center">
                            <FaCoins className="text-warning me-1" />
                            {user.credits}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsDashboard;
