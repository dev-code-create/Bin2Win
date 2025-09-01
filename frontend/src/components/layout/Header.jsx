import React from 'react';
import { Navbar, Nav, NavDropdown, Badge, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaCoins, FaCrown, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatNumber } from '../../utils';

const Header = () => {
  const { user, logout, getRankColor } = useAuth();
  const { theme, setTheme } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Navbar bg={theme === 'dark' ? 'dark' : 'light'} variant={theme} expand="lg" sticky="top" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <span className="text-success">🌱</span> Simhastha Clean & Green
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <>
                <Nav.Link as={Link} to="/dashboard">
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/submit-waste">
                  Submit Waste
                </Nav.Link>
                <Nav.Link as={Link} to="/rewards">
                  Rewards
                </Nav.Link>
                <Nav.Link as={Link} to="/booths">
                  Find Booths
                </Nav.Link>
                <Nav.Link as={Link} to="/leaderboard">
                  Leaderboard
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav>
            {user ? (
              <>
                {/* Green Credits Display */}
                <Nav.Link as={Link} to="/profile" className="d-flex align-items-center">
                  <FaCoins className="text-warning me-1" />
                  <span className="fw-bold text-success">
                    {formatNumber(user.greenCredits)}
                  </span>
                </Nav.Link>

                {/* User Dropdown */}
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center">
                      <FaUser className="me-2" />
                      <span className="d-none d-md-inline">{user.name}</span>
                      <Badge 
                        className="ms-2" 
                        style={{ backgroundColor: getRankColor(user.currentRank) }}
                      >
                        <FaCrown className="me-1" size={10} />
                        {user.currentRank}
                      </Badge>
                    </span>
                  }
                  id="user-nav-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    <FaUser className="me-2" />
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/history">
                    <FaBell className="me-2" />
                    History
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
