import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaHistory } from 'react-icons/fa';

const HistoryPage = () => {
  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="fw-bold">
          <FaHistory className="text-secondary me-2" />
          Transaction History
        </h2>
        <p className="text-muted">View your waste submissions and reward redemptions</p>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaHistory size={80} className="text-secondary mb-4" />
          <h4 className="fw-bold mb-3">History Feature</h4>
          <Alert variant="info">
            This feature includes transaction history, filtering, 
            detailed views, and export functionality. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default HistoryPage;
