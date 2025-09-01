import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaRecycle } from 'react-icons/fa';

const SubmissionsPage: React.FC = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <FaRecycle className="text-success me-2" />
            Waste Submissions
          </h2>
          <p className="text-muted mb-0">Review and manage waste submissions</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaRecycle size={80} className="text-success mb-4" />
          <h4 className="fw-bold mb-3">Submission Management System</h4>
          <Alert variant="info">
            This page will include submission listing, filtering, approval/rejection workflow,
            photo viewing, quality scoring, and batch operations. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SubmissionsPage;
