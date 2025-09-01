import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaUser } from 'react-icons/fa';

const ProfilePage = () => {
  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="fw-bold">
          <FaUser className="text-primary me-2" />
          Profile Settings
        </h2>
        <p className="text-muted">Manage your account and preferences</p>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaUser size={80} className="text-primary mb-4" />
          <h4 className="fw-bold mb-3">Profile Feature</h4>
          <Alert variant="info">
            This feature includes profile editing, preferences, 
            statistics, and account management. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProfilePage;
