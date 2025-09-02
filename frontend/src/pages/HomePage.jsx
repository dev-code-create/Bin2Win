import React from "react";
import { Container, Row, Col, Button, Card, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaRecycle,
  FaGift,
  FaMapMarkerAlt,
  FaTrophy,
  FaLeaf,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import SponsorTest from "../components/SponsorTest";

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug: Log when component renders
  console.log("HomePage rendering - Sponsor section should be visible");

  const features = [
    {
      icon: FaRecycle,
      title: "Submit Waste",
      description:
        "Scan QR codes at collection booths and earn green credits for proper waste disposal",
      color: "success",
    },
    {
      icon: FaGift,
      title: "Redeem Rewards",
      description:
        "Use your green credits to get prasad, flowers, coconuts, and other eco-friendly gifts",
      color: "warning",
    },
    {
      icon: FaMapMarkerAlt,
      title: "Find Booths",
      description:
        "Locate nearby waste collection booths with real-time availability status",
      color: "info",
    },
    {
      icon: FaTrophy,
      title: "Leaderboard",
      description:
        "Compete with other devotees and climb the green credit rankings",
      color: "primary",
    },
  ];

  const stats = [
    { label: "Waste Collected", value: "2,500+ kg", icon: FaRecycle },
    { label: "Active Users", value: "1,200+", icon: FaUsers },
    { label: "Green Credits Earned", value: "15,000+", icon: FaLeaf },
    { label: "Rewards Redeemed", value: "800+", icon: FaGift },
  ];

  return (
    <div className="min-vh-100">
      {/* Hero Section */}
      <section className="bg-gradient-success text-white py-5">
        <Container>
          <Row className="align-items-center min-vh-75">
            <Col lg={6}>
              <div className="mb-5">
                <Badge bg="light" text="success" className="mb-3 px-3 py-2">
                  🌱 Simhastha 2028
                </Badge>
                <h1 className="display-4 fw-bold mb-4">
                  Clean & Green
                  <br />
                  <span className="text-warning">Initiative</span>
                </h1>
                <p className="lead mb-4 opacity-90">
                  Join thousands of devotees in making Simhastha 2028 the
                  cleanest and greenest Kumbh Mela ever. Earn rewards for proper
                  waste disposal and contribute to a sustainable future.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  {user ? (
                    <Button
                      size="lg"
                      variant="warning"
                      className="fw-bold px-4"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        variant="warning"
                        className="fw-bold px-4"
                        onClick={() => navigate("/login")}
                      >
                        Get Started
                      </Button>
                      <Button
                        size="lg"
                        variant="outline-light"
                        className="fw-bold px-4"
                        onClick={() => navigate("/login")}
                      >
                        Login
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-4 p-5 backdrop-blur">
                  <FaLeaf size={120} className="text-warning mb-4" />
                  <h3 className="fw-bold mb-3">Be Part of the Change</h3>
                  <p className="mb-0 opacity-90">
                    Every piece of waste properly disposed contributes to a
                    cleaner, greener Simhastha experience for millions of
                    devotees.
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row>
            {stats.map((stat, index) => (
              <Col md={6} lg={3} key={index} className="mb-4 mb-lg-0">
                <Card className="text-center border-0 h-100 hover-shadow">
                  <Card.Body className="p-4">
                    <stat.icon size={40} className="text-success mb-3" />
                    <h3 className="fw-bold text-success mb-2">{stat.value}</h3>
                    <p className="text-muted mb-0">{stat.label}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">How It Works</h2>
            <p className="lead text-muted">
              Simple steps to earn green credits and make a difference
            </p>
          </div>
          <Row>
            {features.map((feature, index) => (
              <Col md={6} lg={3} key={index} className="mb-4">
                <Card className="text-center border-0 h-100 hover-shadow">
                  <Card.Body className="p-4">
                    <div
                      className={`bg-${feature.color} bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3`}
                      style={{ width: "80px", height: "80px" }}
                    >
                      <feature.icon
                        size={32}
                        className={`text-${feature.color}`}
                      />
                    </div>
                    <h5 className="fw-bold mb-3">{feature.title}</h5>
                    <p className="text-muted mb-0">{feature.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-success text-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={8}>
              <h2 className="fw-bold mb-3">Ready to Make a Difference?</h2>
              <p className="lead mb-0 opacity-90">
                Join the Clean & Green Initiative today and be part of the
                movement towards a sustainable Simhastha 2028.
              </p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <div className="mt-4 mt-lg-0">
                {user ? (
                  <Button
                    size="lg"
                    variant="warning"
                    className="fw-bold px-4"
                    onClick={() => navigate("/submit-waste")}
                  >
                    Submit Waste Now
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="warning"
                    className="fw-bold px-4"
                    onClick={() => navigate("/login")}
                  >
                    Join Now
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* About Section */}
      <section className="py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h2 className="fw-bold mb-4">About Simhastha Clean & Green</h2>
              <p className="mb-4">
                The Simhastha Clean & Green Initiative is a revolutionary
                approach to waste management during the world's largest
                religious gathering. By gamifying waste disposal and offering
                meaningful rewards, we're creating a sustainable ecosystem that
                benefits both devotees and the environment.
              </p>
              <div className="row">
                <div className="col-6">
                  <h4 className="fw-bold text-success">2028</h4>
                  <p className="text-muted small">Next Simhastha</p>
                </div>
                <div className="col-6">
                  <h4 className="fw-bold text-success">100M+</h4>
                  <p className="text-muted small">Expected Visitors</p>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="bg-light rounded-4 p-5 text-center">
                <FaRecycle size={80} className="text-success mb-4" />
                <h4 className="fw-bold mb-3">Our Mission</h4>
                <p className="text-muted mb-0">
                  To create the world's largest crowd-sourced waste management
                  system, making Simhastha 2028 a model for sustainable mass
                  gatherings worldwide.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Test Component */}

      {/* Sponsors Section */}
      <section
        className="py-5 bg-light"
        style={{
          border: "3px solid #28a745",
          backgroundColor: "#f8f9fa",
          margin: "20px 0",
          position: "relative",
          zIndex: 1000,
        }}
      >
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2
                className="fw-bold mb-3"
                style={{ color: "#28a745", fontSize: "2.5rem" }}
              >
                🌟 Our Proud Sponsors 🌟
              </h2>
              <p className="lead text-muted mb-0">
                These organizations are committed to making Simhastha 2028 a
                Clean & Green event
              </p>
              <div
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "5px 15px",
                  borderRadius: "20px",
                  display: "inline-block",
                  marginTop: "10px",
                  fontSize: "0.9rem",
                }}
              >
                SPONSOR SECTION ACTIVE
              </div>
            </Col>
          </Row>
          <Row className="g-4 justify-content-center">
            <Col xs={6} sm={4} md={3} lg={2}>
              <div
                className="text-center"
                style={{
                  padding: "10px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  backgroundColor: "white",
                }}
              >
                <img
                  src="/sponsors/bisleri.svg"
                  alt="Bisleri"
                  className="img-fluid mb-3"
                  style={{
                    maxHeight: "100px",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                    border: "1px solid #e9ecef",
                  }}
                />
                <h6 className="fw-bold mb-1">Bisleri</h6>
                <small className="text-muted">Official Water Partner</small>
              </div>
            </Col>
            <Col xs={6} sm={4} md={3} lg={2}>
              <div className="text-center">
                <img
                  src="/sponsors/hindustan-unilever.svg"
                  alt="Hindustan Unilever Limited"
                  className="img-fluid mb-3"
                  style={{
                    maxHeight: "100px",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                  }}
                />
                <h6 className="fw-bold mb-1">Hindustan Unilever</h6>
                <small className="text-muted">Sustainability Partner</small>
              </div>
            </Col>
            <Col xs={6} sm={4} md={3} lg={2}>
              <div className="text-center">
                <img
                  src="/sponsors/indianoil.jpg"
                  alt="Clean & Green Initiative"
                  className="img-fluid mb-3"
                  style={{
                    maxHeight: "100px",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                  }}
                />
                <h6 className="fw-bold mb-1">Clean & Green</h6>
                <small className="text-muted">Initiative Partner</small>
              </div>
            </Col>
            <Col xs={6} sm={4} md={3} lg={2}>
              <div className="text-center">
                <img
                  src="/sponsors/patanjali.webp"
                  alt="IndianOil"
                  className="img-fluid mb-3"
                  style={{
                    maxHeight: "100px",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                  }}
                />
                <h6 className="fw-bold mb-1">IndianOil</h6>
                <small className="text-muted">Energy Partner</small>
              </div>
            </Col>
          </Row>
          <Row className="mt-5">
            <Col className="text-center">
              <Button variant="outline-success" size="lg">
                <FaLeaf className="me-2" />
                Learn More About Our Partners
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <p className="mb-0">
                © 2024 Simhastha Clean & Green Initiative. All rights reserved.
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="mb-0">
                <a href="#" className="text-white text-decoration-none me-3">
                  Privacy Policy
                </a>
                <a href="#" className="text-white text-decoration-none">
                  Terms of Service
                </a>
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default HomePage;
