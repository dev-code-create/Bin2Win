import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaMapMarkerAlt } from 'react-icons/fa';

const BoothsPage: React.FC = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <FaMapMarkerAlt className="text-info me-2" />
            Collection Booths
          </h2>
          <p className="text-muted mb-0">Manage collection booth locations and settings</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaMapMarkerAlt size={80} className="text-info mb-4" />
          <h4 className="fw-bold mb-3">Booth Management System</h4>
          <Alert variant="info">
            This page will include booth listing, map view, capacity monitoring,
            booth creation/editing, QR code management, and status tracking. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BoothsPage;
