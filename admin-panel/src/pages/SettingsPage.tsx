import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaCog } from 'react-icons/fa';

const SettingsPage: React.FC = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <FaCog className="text-secondary me-2" />
            System Settings
          </h2>
          <p className="text-muted mb-0">Configure system settings and preferences</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaCog size={80} className="text-secondary mb-4" />
          <h4 className="fw-bold mb-3">System Configuration</h4>
          <Alert variant="info">
            This page will include system configuration, admin management,
            notification settings, backup/restore, and system maintenance tools. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SettingsPage;
