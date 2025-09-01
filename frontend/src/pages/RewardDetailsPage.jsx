import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaGift } from 'react-icons/fa';

const RewardDetailsPage = () => {
  return (
    <div>
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaGift size={80} className="text-warning mb-4" />
          <h4 className="fw-bold mb-3">Reward Details</h4>
          <Alert variant="info">
            This page shows detailed reward information and redemption options.
            Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RewardDetailsPage;
