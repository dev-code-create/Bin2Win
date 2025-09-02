import React from "react";
import { Nav, Card } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import {
  FaTachometerAlt,
  FaUsers,
  FaRecycle,
  FaMapMarkerAlt,
  FaGift,
  FaChartLine,
  FaCog,
  FaClipboardList,
  FaUserShield,
  FaSignOutAlt,
  FaBars,
  FaLeaf,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminSidebar = ({ collapsed, onToggleCollapse, onNavigate }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const menuItems = [
    {
      path: "/admin/dashboard",
      icon: FaTachometerAlt,
      label: "Dashboard",
      description: "Overview & Stats",
    },
    {
      path: "/admin/users",
      icon: FaUsers,
      label: "User Management",
      description: "Manage Users",
    },
    {
      path: "/admin/submissions",
      icon: FaRecycle,
      label: "Waste Submissions",
      description: "Review Submissions",
    },
    {
      path: "/admin/booths",
      icon: FaMapMarkerAlt,
      label: "Collection Booths",
      description: "Manage Booths",
    },
    {
      path: "/admin/rewards",
      icon: FaGift,
      label: "Rewards",
      description: "Reward Catalog",
    },
    {
      path: "/admin/analytics",
      icon: FaChartLine,
      label: "Analytics",
      description: "Reports & Insights",
    },
    {
      path: "/admin/admins",
      icon: FaUserShield,
      label: "Admin Management",
      description: "Manage Admins",
    },
    {
      path: "/admin/settings",
      icon: FaCog,
      label: "Settings",
      description: "System Settings",
    },
  ];

  return (
    <div
      className={`admin-sidebar bg-dark text-white ${
        collapsed ? "collapsed" : ""
      }`}
    >
      {/* Brand */}
      <div className="sidebar-brand p-3 border-bottom border-secondary">
        <div className="d-flex align-items-center">
          <FaLeaf className="text-success me-2" size={24} />
          {!collapsed && (
            <div className="sidebar-text">
              <h5 className="mb-0 text-white">Bin2Win</h5>
              <small className="text-muted">Admin Panel</small>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-2 border-bottom border-secondary d-none d-lg-block">
        <button
          className="btn btn-outline-light btn-sm w-100"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <FaBars />
          {!collapsed && <span className="ms-2 sidebar-text">Collapse</span>}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <Card className="m-3 bg-secondary border-0">
          <Card.Body className="p-3">
            <div className="d-flex align-items-center">
              <div
                className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: "40px", height: "40px" }}
              >
                <FaUserShield className="text-white" />
              </div>
              <div>
                <div className="text-white fw-bold">
                  {user?.fullName || user?.name}
                </div>
                <small className="text-light opacity-75">Administrator</small>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Navigation */}
      <Nav className="flex-column flex-grow-1 p-2">
        {menuItems.map((item, index) => (
          <LinkContainer key={index} to={item.path}>
            <Nav.Link
              className={`sidebar-nav-link text-white d-flex align-items-center p-3 mb-1 rounded ${
                collapsed ? "justify-content-center" : ""
              }`}
              onClick={onNavigate}
              title={collapsed ? item.label : item.description}
            >
              <item.icon className="me-3" size={18} />
              {!collapsed && (
                <div className="sidebar-text">
                  <div className="fw-medium">{item.label}</div>
                  <small className="text-light opacity-75">
                    {item.description}
                  </small>
                </div>
              )}
            </Nav.Link>
          </LinkContainer>
        ))}
      </Nav>

      {/* Logout */}
      <div className="p-2 border-top border-secondary">
        <button
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center p-2"
          onClick={handleLogout}
          title="Logout"
        >
          <FaSignOutAlt className="me-2" />
          {!collapsed && <span className="sidebar-text">Logout</span>}
        </button>
      </div>

      <style jsx>{`
        .admin-sidebar {
          width: 280px;
          min-height: 100vh;
          transition: width 0.3s ease;
          position: relative;
        }

        .admin-sidebar.collapsed {
          width: 80px;
        }

        .sidebar-nav-link {
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .sidebar-nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2);
          color: white !important;
        }

        .sidebar-nav-link.active {
          background-color: #0d6efd !important;
          border-color: #0d6efd;
          color: white !important;
        }

        .collapsed .sidebar-text {
          display: none;
        }

        .collapsed .sidebar-brand {
          text-align: center;
        }

        .collapsed .sidebar-nav-link {
          justify-content: center;
        }

        @media (max-width: 991.98px) {
          .admin-sidebar {
            width: 100%;
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSidebar;
