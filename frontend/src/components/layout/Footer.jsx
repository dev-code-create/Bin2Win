import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <Row>
          <Col md={4} className="mb-3">
            <h5 className="text-success">🌱 Simhastha Clean & Green</h5>
            <p className="small text-muted">
              Making Simhastha 2028 eco-friendly through community-driven waste
              management and green credit rewards system.
            </p>
          </Col>

          <Col md={2} className="mb-3">
            <h6>Quick Links</h6>
            <ul className="list-unstyled small">
              <li>
                <Link
                  to="/dashboard"
                  className="text-light text-decoration-none"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/submit-waste"
                  className="text-light text-decoration-none"
                >
                  Submit Waste
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="text-light text-decoration-none">
                  Rewards
                </Link>
              </li>
              <li>
                <Link to="/booths" className="text-light text-decoration-none">
                  Find Booths
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-light text-decoration-none"
                >
                  Leaderboard
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={2} className="mb-3">
            <h6>Support</h6>
            <ul className="list-unstyled small">
              <li>
                <a href="#" className="text-light text-decoration-none">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-light text-decoration-none">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-light text-decoration-none">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-light text-decoration-none">
                  Terms of Service
                </a>
              </li>
            </ul>
          </Col>

          <Col md={4} className="mb-3">
            <h6>Connect With Us</h6>
            <div className="d-flex gap-3 mb-3">
              <a href="#" className="text-light">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-light">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-light">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-light">
                <FaLinkedin size={20} />
              </a>
            </div>
            <p className="small text-muted mb-0">
              Join thousands of devotees making Simhastha 2028 sustainable.
            </p>
          </Col>
        </Row>

        <hr className="my-3 border-secondary" />

        <Row>
          <Col md={6}>
            <p className="small mb-0">
              © {currentYear} Simhastha Clean & Green Initiative. All rights
              reserved.
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <p className="small mb-0 text-muted">
              Powered by community participation and environmental consciousness.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
