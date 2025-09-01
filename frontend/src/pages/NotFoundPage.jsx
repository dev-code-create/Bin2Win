import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaHome, FaExclamationTriangle } from "react-icons/fa";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <FaExclamationTriangle size={100} className="text-warning mb-4" />
            <h1 className="display-1 fw-bold text-muted">404</h1>
            <h2 className="mb-3">Page Not Found</h2>
            <p className="text-muted mb-4">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Button onClick={() => navigate("/")} variant="success" size="lg">
                <FaHome className="me-2" />
                Go Home
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline-primary"
                size="lg"
              >
                Dashboard
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NotFoundPage;
