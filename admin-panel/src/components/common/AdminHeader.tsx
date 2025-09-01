import React from 'react';
import { Navbar, Nav, NavDropdown, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSignOutAlt, FaCog, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const { admin, logout, getRoleDisplayName, getRoleColor } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="admin-header shadow-sm">
      <div className="container-fluid">
        {/* Sidebar Toggle */}
        <Button
          variant="outline-light"
          size="sm"
          onClick={onToggleSidebar}
          className="me-3 d-lg-inline-block"
        >
          <FaBars />
        </Button>

        {/* Brand */}
        <Navbar.Brand as={Link} to="/dashboard" className="fw-bold">
          <span className="text-success">🌱</span> Admin Panel
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        
        <Navbar.Collapse id="admin-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Notifications */}
            <Nav.Link href="#notifications" className="position-relative me-3">
              <FaBell size={18} />
              <Badge 
                bg="danger" 
                pill 
                className="position-absolute top-0 start-100 translate-middle"
                style={{ fontSize: '0.65rem' }}
              >
                3
              </Badge>
            </Nav.Link>

            {/* Admin Info & Dropdown */}
            {admin && (
              <NavDropdown
                title={
                  <span className="d-flex align-items-center">
                    <FaUser className="me-2" />
                    <span className="d-none d-md-inline">{admin.fullName}</span>
                  </span>
                }
                id="admin-dropdown"
                align="end"
              >
                <NavDropdown.Header>
                  <div className="text-center">
                    <div className="fw-bold">{admin.fullName}</div>
                    <div className="small text-muted">{admin.email}</div>
                    <Badge bg={getRoleColor(admin.role)} className="mt-1">
                      <FaShieldAlt className="me-1" />
                      {getRoleDisplayName(admin.role)}
                    </Badge>
                  </div>
                </NavDropdown.Header>
                
                <NavDropdown.Divider />
                
                <NavDropdown.Item as={Link} to="/settings">
                  <FaCog className="me-2" />
                  Settings
                </NavDropdown.Item>
                
                <NavDropdown.Item href="#profile">
                  <FaUser className="me-2" />
                  Profile
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                
                <NavDropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" />
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </div>

      <style jsx>{`
        .admin-header {
          position: sticky;
          top: 0;
          z-index: 1030;
          border-bottom: 1px solid #dee2e6;
        }
      `}</style>
    </Navbar>
  );
};

export default AdminHeader;
