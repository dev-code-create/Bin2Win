import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaRecycle, FaGift, FaMapMarkerAlt, FaHistory, FaTrophy } from 'react-icons/fa';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/submit-waste', icon: FaRecycle, label: 'Submit Waste' },
    { path: '/rewards', icon: FaGift, label: 'Rewards' },
    { path: '/booths', icon: FaMapMarkerAlt, label: 'Find Booths' },
    { path: '/history', icon: FaHistory, label: 'History' },
    { path: '/leaderboard', icon: FaTrophy, label: 'Leaderboard' },
  ];

  return (
    <div className="bg-light border-bottom">
      <div className="container">
        <Nav variant="pills" className="py-2 justify-content-center justify-content-md-start">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Nav.Item key={path}>
              <Nav.Link
                as={Link}
                to={path}
                active={location.pathname === path}
                className="d-flex align-items-center mx-1"
              >
                <Icon className="me-1 d-none d-md-inline" />
                <span className="small">{label}</span>
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>
    </div>
  );
};

export default Navigation;
