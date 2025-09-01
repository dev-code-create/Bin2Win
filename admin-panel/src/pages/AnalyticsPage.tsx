import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FaChartBar } from 'react-icons/fa';

const AnalyticsPage: React.FC = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <FaChartBar className="text-primary me-2" />
            Analytics & Reports
          </h2>
          <p className="text-muted mb-0">System analytics and detailed reports</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaChartBar size={80} className="text-primary mb-4" />
          <h4 className="fw-bold mb-3">Analytics Dashboard</h4>
          <Alert variant="info">
            This page will include detailed charts, reports, trends analysis,
            environmental impact metrics, and data export functionality. Implementation in progress...
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
