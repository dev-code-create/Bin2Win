import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaGift } from 'react-icons/fa';

const RewardStorePage = () => {
  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="fw-bold">
          <FaGift className="text-warning me-2" />
          Reward Store
        </h2>
        <p className="text-muted">Redeem your green credits for eco-friendly rewards</p>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaGift size={80} className="text-warning mb-4" />
          <h4 className="fw-bold mb-3">Reward Store Feature</h4>
          <Alert variant="info">
            This feature includes reward browsing, filtering, detailed views, 
            and redemption functionality. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RewardStorePage;
