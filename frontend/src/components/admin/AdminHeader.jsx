import React, { useState } from 'react';
import { 
  Navbar, 
  Container, 
  Nav, 
  NavDropdown, 
  Badge, 
  Button, 
  Form, 
  InputGroup,
  Dropdown
} from 'react-bootstrap';
import { 
  FaBars, 
  FaBell, 
  FaUser, 
  FaSearch, 
  FaCog, 
  FaSignOutAlt,
  FaUserShield,
  FaMoon,
  FaSun,
  FaGlobe
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ onToggleSidebar, onToggleSidebarCollapse, sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New User Registration', time: '2 min ago', type: 'info' },
    { id: 2, title: 'Waste Submission Pending', time: '5 min ago', type: 'warning' },
    { id: 3, title: 'System Update Available', time: '1 hour ago', type: 'success' }
  ];

  return (
    <Navbar bg="white" expand="lg" className="border-bottom shadow-sm sticky-top">
      <Container fluid>
        {/* Mobile Menu Toggle */}
        <Button 
          variant="outline-secondary"
          className="d-lg-none me-2"
          onClick={onToggleSidebar}
        >
          <FaBars />
        </Button>

        {/* Desktop Sidebar Toggle */}
        <Button 
          variant="outline-secondary"
          className="d-none d-lg-flex me-3"
          onClick={onToggleSidebarCollapse}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <FaBars />
        </Button>

        {/* Page Title */}
        <Navbar.Brand className="mb-0 h1 text-dark">
          Admin Dashboard
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        <Navbar.Collapse id="admin-navbar-nav">
          {/* Search Bar */}
          <Form className="d-flex mx-auto" style={{maxWidth: '400px'}} onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Search users, submissions, booths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-secondary" type="submit">
                <FaSearch />
              </Button>
            </InputGroup>
          </Form>

          {/* Right Side Navigation */}
          <Nav className="ms-auto align-items-center">
            {/* Theme Toggle */}
            <Nav.Item className="me-2">
              <Button 
                variant="outline-secondary"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </Button>
            </Nav.Item>

            {/* Language Selector */}
            <Dropdown className="me-2">
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                <FaGlobe className="me-1" />
                EN
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>English</Dropdown.Item>
                <Dropdown.Item>हिंदी</Dropdown.Item>
                <Dropdown.Item>मराठी</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Notifications */}
            <NavDropdown
              title={
                <span className="position-relative">
                  <FaBell />
                  {notifications.length > 0 && (
                    <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle badge-sm">
                      {notifications.length}
                    </Badge>
                  )}
                </span>
              }
              id="notifications-dropdown"
              className="me-2"
            >
              <NavDropdown.Header>Notifications</NavDropdown.Header>
              {notifications.length > 0 ? (
                <>
                  {notifications.map((notification) => (
                    <NavDropdown.Item key={notification.id}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{notification.title}</div>
                          <small className="text-muted">{notification.time}</small>
                        </div>
                        <Badge bg={
                          notification.type === 'info' ? 'primary' :
                          notification.type === 'warning' ? 'warning' : 'success'
                        } className="ms-2">
                          {notification.type}
                        </Badge>
                      </div>
                    </NavDropdown.Item>
                  ))}
                  <NavDropdown.Divider />
                  <NavDropdown.Item className="text-center">
                    <small>View All Notifications</small>
                  </NavDropdown.Item>
                </>
              ) : (
                <NavDropdown.Item disabled>
                  <small className="text-muted">No new notifications</small>
                </NavDropdown.Item>
              )}
            </NavDropdown>

            {/* User Profile */}
            <NavDropdown
              title={
                <span className="d-flex align-items-center">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                       style={{width: '32px', height: '32px'}}>
                    <FaUserShield className="text-white" size={14} />
                  </div>
                  <span className="d-none d-md-inline">
                    {user?.fullName || user?.name || 'Admin'}
                  </span>
                </span>
              }
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Header>
                <div>
                  <div className="fw-bold">{user?.fullName || user?.name}</div>
                  <small className="text-muted">{user?.email}</small>
                </div>
              </NavDropdown.Header>
              <NavDropdown.Divider />
              
              <NavDropdown.Item onClick={() => navigate('/admin/profile')}>
                <FaUser className="me-2" />
                Profile
              </NavDropdown.Item>
              
              <NavDropdown.Item onClick={() => navigate('/admin/settings')}>
                <FaCog className="me-2" />
                Settings
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item onClick={handleLogout} className="text-danger">
                <FaSignOutAlt className="me-2" />
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style jsx>{`
        .badge-sm {
          font-size: 0.65em;
          padding: 0.25em 0.4em;
        }
        
        .navbar-nav .nav-link {
          color: #495057 !important;
        }
        
        .navbar-nav .nav-link:hover {
          color: #0d6efd !important;
        }
        
        .dropdown-toggle::after {
          margin-left: 0.5em;
        }
        
        .dropdown-item {
          padding: 0.5rem 1rem;
        }
        
        .dropdown-item:active {
          background-color: #0d6efd;
        }
      `}</style>
    </Navbar>
  );
};

export default AdminHeader;
