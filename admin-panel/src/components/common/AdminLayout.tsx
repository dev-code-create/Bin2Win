import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  fluid?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, fluid = false }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-layout">
      <AdminHeader onToggleSidebar={toggleSidebar} />
      
      <div className="admin-content d-flex">
        <AdminSidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-grow-1 ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Container fluid={fluid} className="py-4">
            {children}
          </Container>
        </main>
      </div>

      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          background-color: #f8f9fa;
        }
        
        .admin-content {
          min-height: calc(100vh - 56px); /* Subtract header height */
        }
        
        main {
          transition: margin-left 0.3s ease;
          margin-left: 250px; /* Sidebar width */
        }
        
        main.sidebar-collapsed {
          margin-left: 60px; /* Collapsed sidebar width */
        }
        
        @media (max-width: 768px) {
          main,
          main.sidebar-collapsed {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
