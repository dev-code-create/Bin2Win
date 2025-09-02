import React, { useState } from 'react';
import { Container, Row, Col, Offcanvas } from 'react-bootstrap';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ children, fluid = false }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-layout d-flex min-vh-100">
      {/* Desktop Sidebar */}
      <div className={`d-none d-lg-flex ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminSidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebarCollapse} 
        />
      </div>

      {/* Mobile Sidebar */}
      <Offcanvas 
        show={showSidebar} 
        onHide={toggleSidebar} 
        placement="start"
        className="d-lg-none"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Admin Panel</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <AdminSidebar 
            collapsed={false} 
            onToggleCollapse={() => {}} 
            onNavigate={() => setShowSidebar(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader 
          onToggleSidebar={toggleSidebar}
          onToggleSidebarCollapse={toggleSidebarCollapse}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-grow-1 bg-light">
          <Container fluid={fluid} className="py-4">
            {children}
          </Container>
        </main>
      </div>

      <style jsx>{`
        .admin-layout {
          background-color: #f8f9fa;
        }
        
        .sidebar-collapsed .admin-sidebar {
          width: 80px;
        }
        
        .sidebar-collapsed .sidebar-text {
          display: none;
        }
        
        .sidebar-collapsed .sidebar-brand {
          padding: 1rem 0.5rem;
        }
        
        .sidebar-collapsed .nav-link {
          justify-content: center;
          padding: 0.75rem 0.5rem;
        }
        
        @media (max-width: 991.98px) {
          .admin-sidebar {
            position: fixed;
            z-index: 1040;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
