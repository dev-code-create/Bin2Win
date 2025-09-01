import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaUsers } from 'react-icons/fa';

const UsersPage: React.FC = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <FaUsers className="text-primary me-2" />
            User Management
          </h2>
          <p className="text-muted mb-0">Manage user accounts and permissions</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaUsers size={80} className="text-primary mb-4" />
          <h4 className="fw-bold mb-3">User Management System</h4>
          <Alert variant="info">
            This page will include user listing, search, filtering, account management,
            credit adjustments, and user statistics. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UsersPage;
