import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaMapMarkerAlt } from 'react-icons/fa';

const BoothDetailsPage = () => {
  return (
    <div>
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaMapMarkerAlt size={80} className="text-info mb-4" />
          <h4 className="fw-bold mb-3">Booth Details</h4>
          <Alert variant="info">
            This page shows detailed booth information, location, and status.
            Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BoothDetailsPage;
