import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaRecycle, 
  FaMapMarkerAlt, 
  FaGift, 
  FaChartBar, 
  FaCog,
  FaHome
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  collapsed: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const menuItems = [
    {
      path: '/dashboard',
      icon: FaTachometerAlt,
      label: 'Dashboard',
      permission: null // Dashboard is accessible to all authenticated admins
    },
    {
      path: '/users',
      icon: FaUsers,
      label: 'Users',
      permission: ['users', 'read']
    },
    {
      path: '/submissions',
      icon: FaRecycle,
      label: 'Submissions',
      permission: ['waste', 'read']
    },
    {
      path: '/booths',
      icon: FaMapMarkerAlt,
      label: 'Booths',
      permission: ['booths', 'read']
    },
    {
      path: '/rewards',
      icon: FaGift,
      label: 'Rewards',
      permission: ['rewards', 'read']
    },
    {
      path: '/analytics',
      icon: FaChartBar,
      label: 'Analytics',
      permission: ['analytics', 'read']
    },
    {
      path: '/settings',
      icon: FaCog,
      label: 'Settings',
      permission: ['system', 'read']
    }
  ];

  // Filter menu items based on permissions
  const accessibleItems = menuItems.filter(item => {
    if (!item.permission) return true;
    const [module, action] = item.permission;
    return hasPermission(module, action);
  });

  return (
    <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        {/* Quick Access to Main App */}
        <div className="sidebar-section mb-3">
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline-primary btn-sm w-100"
            title="View Main Website"
          >
            <FaHome className="me-2" />
            {!collapsed && 'Main Site'}
          </a>
        </div>

        {/* Navigation Menu */}
        <Nav className="flex-column">
          {accessibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Nav.Item key={item.path}>
                <Nav.Link
                  as={Link}
                  to={item.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="sidebar-icon" />
                  {!collapsed && <span className="sidebar-label">{item.label}</span>}
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
      </div>

      <style jsx>{`
        .admin-sidebar {
          width: 250px;
          min-height: 100vh;
          background: #343a40;
          position: fixed;
          top: 56px; /* Header height */
          left: 0;
          transition: width 0.3s ease;
          z-index: 1020;
          overflow-y: auto;
        }
        
        .admin-sidebar.collapsed {
          width: 60px;
        }
        
        .sidebar-content {
          padding: 1rem 0.5rem;
        }
        
        .sidebar-section {
          padding: 0 0.5rem;
        }
        
        .sidebar-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: #adb5bd !important;
          text-decoration: none;
          border-radius: 0.375rem;
          margin: 0.125rem 0;
          transition: all 0.2s ease;
        }
        
        .sidebar-link:hover {
          background-color: #495057;
          color: #fff !important;
        }
        
        .sidebar-link.active {
          background-color: #0d6efd;
          color: #fff !important;
        }
        
        .sidebar-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        
        .sidebar-label {
          margin-left: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
        }
        
        .collapsed .sidebar-link {
          justify-content: center;
          padding: 0.75rem 0.5rem;
        }
        
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          
          .admin-sidebar.show {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSidebar;
