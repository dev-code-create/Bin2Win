import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaTrophy } from 'react-icons/fa';

const LeaderboardPage = () => {
  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="fw-bold">
          <FaTrophy className="text-warning me-2" />
          Leaderboard
        </h2>
        <p className="text-muted">See top contributors and your ranking</p>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaTrophy size={80} className="text-warning mb-4" />
          <h4 className="fw-bold mb-3">Leaderboard Feature</h4>
          <Alert variant="info">
            This feature includes rankings, user positions, 
            achievements, and competitive elements. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
