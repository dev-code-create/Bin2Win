import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaGift } from 'react-icons/fa';

const RewardsPage: React.FC = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <FaGift className="text-warning me-2" />
            Reward Management
          </h2>
          <p className="text-muted mb-0">Manage rewards catalog and inventory</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaGift size={80} className="text-warning mb-4" />
          <h4 className="fw-bold mb-3">Reward Management System</h4>
          <Alert variant="info">
            This page will include reward catalog management, stock tracking,
            category management, sponsor management, and redemption analytics. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RewardsPage;
