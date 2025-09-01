import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <FaExclamationTriangle size={100} className="text-warning mb-4" />
            <h1 className="display-1 fw-bold text-muted">404</h1>
            <h2 className="mb-3">Page Not Found</h2>
            <p className="text-muted mb-4">
              The admin page you're looking for doesn't exist or has been moved.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Button as={Link} to="/dashboard" variant="primary" size="lg">
                <FaHome className="me-2" />
                Admin Dashboard
              </Button>
              <Button as="a" href="/" variant="outline-secondary" size="lg">
                Main Website
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NotFoundPage;
