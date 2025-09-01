import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  ProgressBar,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaCoins,
  FaRecycle,
  FaGift,
  FaTrophy,
  FaMapMarkerAlt,
  FaLeaf,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import {
  formatNumber,
  formatRelativeTime,
  getWasteTypeColor,
  getWasteTypeIcon,
} from "../utils";
import apiService from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, getRankColor, getNextRankThreshold, getRankProgress } =
    useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [popularRewards, setPopularRewards] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsResponse, submissionsResponse, rewardsResponse] = await Promise.all([
        apiService.getUserStatistics('30d'),
        apiService.getWasteSubmissions({ limit: 5 }),
        apiService.getPopularRewards(4),
      ]);

      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }

      if (submissionsResponse.success) {
        setRecentSubmissions(submissionsResponse.data.submissions || []);
      }

      if (rewardsResponse.success) {
        setPopularRewards(rewardsResponse.data || []);
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      setError("Failed to load dashboard data. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="large" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="danger">
        <h5>Authentication Required</h5>
        <p>Please log in to view your dashboard.</p>
        <Button variant="primary" onClick={() => navigate("/login")}>
          Go to Login
        </Button>
      </Alert>
    );
  }

  const nextRank = getNextRankThreshold();
  const rankProgress = getRankProgress();

  return (
    <div>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-gradient-success text-white">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <h2 className="fw-bold mb-2">
                    Welcome back, {user.name}! 🌱
                  </h2>
                  <p className="mb-3 opacity-90">
                    Thank you for contributing to a cleaner, greener Simhastha.
                    Keep up the great work!
                  </p>
                  <div className="d-flex gap-3 flex-wrap">
                    <Button
                      variant="warning"
                      size="lg"
                      className="fw-bold"
                      onClick={() => navigate("/submit-waste")}
                    >
                      <FaRecycle className="me-2" />
                      Submit Waste
                    </Button>
                    <Button
                      variant="outline-light"
                      size="lg"
                      onClick={() => navigate("/rewards")}
                    >
                      <FaGift className="me-2" />
                      Browse Rewards
                    </Button>
                  </div>
                </Col>
                <Col md={4} className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-4 p-3">
                    <FaLeaf size={60} className="text-warning mb-2" />
                    <h4 className="fw-bold mb-1">{formatNumber(user.greenCredits)}</h4>
                    <small className="opacity-90">Green Credits</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 hover-shadow">
            <Card.Body className="text-center">
              <FaCoins size={40} className="text-warning mb-3" />
              <h3 className="fw-bold text-success mb-2">
                {formatNumber(user.greenCredits)}
              </h3>
              <p className="text-muted mb-0">Green Credits</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 hover-shadow">
            <Card.Body className="text-center">
              <FaRecycle size={40} className="text-success mb-3" />
              <h3 className="fw-bold text-success mb-2">
                {formatNumber(user.totalWasteSubmitted)}kg
              </h3>
              <p className="text-muted mb-0">Waste Submitted</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 hover-shadow">
            <Card.Body className="text-center">
              <FaTrophy size={40} className="text-primary mb-3" />
              <h3 className="fw-bold mb-2" style={{ color: getRankColor(user.currentRank) }}>
                {user.currentRank}
              </h3>
              <p className="text-muted mb-0">Current Rank</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 hover-shadow">
            <Card.Body className="text-center">
              <FaGift size={40} className="text-info mb-3" />
              <h3 className="fw-bold text-success mb-2">
                {statistics?.totalRedemptions || 0}
              </h3>
              <p className="text-muted mb-0">Rewards Redeemed</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Rank Progress */}
      {nextRank && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">
                    <FaTrophy className="text-warning me-2" />
                    Rank Progress
                  </h5>
                  <Badge bg="primary">{user.currentRank}</Badge>
                </div>
                <div className="mb-2">
                  <div className="d-flex justify-content-between text-sm">
                    <span>Progress to {nextRank.rank}</span>
                    <span>{formatNumber(nextRank.pointsNeeded)} points needed</span>
                  </div>
                </div>
                <ProgressBar 
                  now={rankProgress} 
                  variant="warning" 
                  style={{ height: '10px' }}
                />
                <small className="text-muted mt-2 d-block">
                  Keep submitting waste to reach the next rank and unlock exclusive rewards!
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        {/* Recent Submissions */}
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaRecycle className="text-success me-2" />
                Recent Submissions
              </h5>
            </Card.Header>
            <Card.Body>
              {recentSubmissions.length === 0 ? (
                <div className="text-center py-4">
                  <FaRecycle size={50} className="text-muted mb-3" />
                  <h6>No submissions yet</h6>
                  <p className="text-muted mb-3">
                    Start your green journey by submitting your first waste!
                  </p>
                  <Button
                    variant="success"
                    onClick={() => navigate("/submit-waste")}
                  >
                    Submit Waste Now
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Points</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSubmissions.map((submission) => (
                        <tr key={submission.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                {getWasteTypeIcon(submission.wasteType)}
                              </span>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: getWasteTypeColor(submission.wasteType),
                                  color: 'white'
                                }}
                              >
                                {submission.wasteType}
                              </span>
                            </div>
                          </td>
                          <td>{submission.quantity}kg</td>
                          <td>
                            <span className="fw-bold text-success">
                              +{submission.pointsEarned}
                            </span>
                          </td>
                          <td>
                            <Badge
                              bg={
                                submission.status === "approved"
                                  ? "success"
                                  : submission.status === "pending"
                                  ? "warning"
                                  : "danger"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </td>
                          <td className="text-muted">
                            {formatRelativeTime(submission.submissionDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {recentSubmissions.length > 0 && (
                <div className="text-center mt-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate("/history")}
                  >
                    View All Submissions
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Popular Rewards */}
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaGift className="text-warning me-2" />
                Popular Rewards
              </h5>
            </Card.Header>
            <Card.Body>
              {popularRewards.length === 0 ? (
                <div className="text-center py-4">
                  <FaGift size={40} className="text-muted mb-3" />
                  <p className="text-muted mb-0">No rewards available</p>
                </div>
              ) : (
                <div>
                  {popularRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="d-flex align-items-center p-2 rounded hover-bg-light cursor-pointer"
                      onClick={() => navigate(`/rewards/${reward.id}`)}
                    >
                      <div className="flex-shrink-0 me-3">
                        <img
                          src={reward.images?.[0]?.url || '/placeholder-reward.jpg'}
                          alt={reward.name}
                          className="rounded"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{reward.name}</h6>
                        <div className="d-flex align-items-center">
                          <FaCoins className="text-warning me-1" size={12} />
                          <small className="text-success fw-bold">
                            {formatNumber(reward.pointsRequired)} points
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => navigate("/rewards")}
                    >
                      View All Rewards
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  onClick={() => navigate("/submit-waste")}
                >
                  <FaRecycle className="me-2" />
                  Submit Waste
                </Button>
                <Button
                  variant="warning"
                  onClick={() => navigate("/rewards")}
                >
                  <FaGift className="me-2" />
                  Browse Rewards
                </Button>
                <Button
                  variant="info"
                  onClick={() => navigate("/booths")}
                >
                  <FaMapMarkerAlt className="me-2" />
                  Find Booths
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate("/leaderboard")}
                >
                  <FaTrophy className="me-2" />
                  Leaderboard
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
