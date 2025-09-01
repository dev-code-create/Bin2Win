import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Alert,
  Modal,
  ProgressBar 
} from 'react-bootstrap';
import { 
  FaUser, 
  FaQrcode, 
  FaCoins, 
  FaTrophy, 
  FaRedo,
  FaDownload,
  FaCopy,
  FaEye,
  FaShareAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  // Mock data - replace with actual API calls
  const mockQRData = {
    qrCode: "SIMHASTHA_USER_A1B2C3D4E5F6G7H8",
    qrImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHRleHQgeD0iNTAiIHk9IjEwMCI+UVIgQ29kZTwvdGV4dD48L3N2Zz4=",
    generatedAt: new Date().toLocaleDateString()
  };

  useEffect(() => {
    // Load user's QR code on component mount
    loadUserQRCode();
  }, []);

  const loadUserQRCode = async () => {
    try {
      setIsLoadingQR(true);
      // const response = await apiService.getUserQRCode();
      // setQrCodeData(response.data);
      
      // For demo purposes, use mock data
      setQrCodeData(mockQRData);
    } catch (error) {
      console.error("Failed to load QR code:", error);
      toast.error("Failed to load your QR code");
    } finally {
      setIsLoadingQR(false);
    }
  };

  const regenerateQRCode = async () => {
    try {
      setIsLoadingQR(true);
      // const response = await apiService.regenerateUserQRCode();
      // setQrCodeData(response.data);
      
      // For demo purposes, generate new mock data
      const newQRData = {
        ...mockQRData,
        qrCode: "SIMHASTHA_USER_" + Math.random().toString(36).substring(2, 15).toUpperCase(),
        generatedAt: new Date().toLocaleDateString()
      };
      setQrCodeData(newQRData);
      toast.success("QR code regenerated successfully!");
    } catch (error) {
      console.error("Failed to regenerate QR code:", error);
      toast.error("Failed to regenerate QR code");
    } finally {
      setIsLoadingQR(false);
    }
  };

  const copyQRCode = () => {
    if (qrCodeData?.qrCode) {
      navigator.clipboard.writeText(qrCodeData.qrCode);
      toast.success("QR code copied to clipboard!");
    }
  };

  const shareQRCode = () => {
    if (navigator.share && qrCodeData?.qrCode) {
      navigator.share({
        title: 'My Simhastha 2028 QR Code',
        text: `My waste collection QR code: ${qrCodeData.qrCode}`,
      });
    } else {
      copyQRCode();
    }
  };

  const downloadQRCode = () => {
    // Create a download link for the QR code image
    if (qrCodeData?.qrImage) {
      const link = document.createElement('a');
      link.href = qrCodeData.qrImage;
      link.download = `simhastha-qr-${user?.username || 'user'}.png`;
      link.click();
      toast.success("QR code downloaded!");
    }
  };

  // Calculate rank progress (mock calculation)
  const currentCredits = user?.greenCredits || 0;
  const nextRankThreshold = 250;
  const rankProgress = Math.min(100, (currentCredits / nextRankThreshold) * 100);

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="fw-bold">
          <FaUser className="text-primary me-2" />
          My Profile
        </h2>
        <p className="text-muted">Your Simhastha 2028 Clean & Green Profile</p>
      </div>

      <Row>
        {/* User Info Card */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="text-center">
              <div className="mb-3">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" 
                     style={{ width: '80px', height: '80px' }}>
                  <FaUser size={40} className="text-white" />
                </div>
              </div>
              <h4 className="fw-bold">{user?.name || "User Name"}</h4>
              <p className="text-muted mb-2">@{user?.username || "username"}</p>
              <p className="text-muted small mb-3">{user?.email || "user@example.com"}</p>
              
              <Badge 
                bg={user?.currentRank === 'Gold' ? 'warning' : 
                    user?.currentRank === 'Silver' ? 'secondary' : 'primary'} 
                className="mb-3"
              >
                {user?.currentRank || "Bronze"} Member
              </Badge>

              <div className="border-top pt-3">
                <Row className="text-center">
                  <Col>
                    <div className="text-success fw-bold fs-4">
                      <FaCoins className="me-1" />
                      {currentCredits}
                    </div>
                    <small className="text-muted">Green Credits</small>
                  </Col>
                  <Col>
                    <div className="text-primary fw-bold fs-4">
                      <FaTrophy className="me-1" />
                      #{user?.leaderboardRank || "N/A"}
                    </div>
                    <small className="text-muted">Rank</small>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>

          {/* Rank Progress */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="fw-bold mb-3">Next Rank Progress</h6>
              <ProgressBar 
                now={rankProgress} 
                variant="success" 
                className="mb-2"
                style={{ height: '8px' }}
              />
              <div className="d-flex justify-content-between">
                <small className="text-muted">{currentCredits} points</small>
                <small className="text-muted">{nextRankThreshold} points</small>
              </div>
              <p className="text-muted small mt-2">
                {nextRankThreshold - currentCredits} more points to reach Silver rank!
              </p>
            </Card.Body>
          </Card>
        </Col>

        {/* QR Code Display */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <FaQrcode className="me-2" />
                Your Collection QR Code
              </h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" className="mb-4">
                <strong>How to use:</strong> Show this QR code to booth operators at collection points. 
                They will scan it to record your waste submissions and credit points to your account instantly!
              </Alert>

              <Row className="align-items-center">
                <Col md={4} className="text-center mb-3 mb-md-0">
                  {/* QR Code Display */}
                  <div className="bg-light border rounded p-3 d-inline-block">
                    {isLoadingQR ? (
                      <div style={{ width: '150px', height: '150px' }} className="d-flex align-items-center justify-content-center">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading QR Code...</span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          width: '150px', 
                          height: '150px',
                          background: 'repeating-linear-gradient(45deg, #000 0px, #000 10px, #fff 10px, #fff 20px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}
                      >
                        QR CODE<br/>
                        {qrCodeData?.qrCode?.slice(-8)}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => setShowQRModal(true)}
                    >
                      <FaEye className="me-1" />
                      View Full Size
                    </Button>
                  </div>
                </Col>

                <Col md={8}>
                  <div className="mb-3">
                    <h6>QR Code ID:</h6>
                    <div className="bg-light p-2 rounded font-monospace small">
                      {qrCodeData?.qrCode || "Loading..."}
                    </div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">
                      Generated on: {qrCodeData?.generatedAt || "Loading..."}
                    </small>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex flex-wrap gap-2">
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={copyQRCode}
                      disabled={!qrCodeData}
                    >
                      <FaCopy className="me-1" />
                      Copy Code
                    </Button>
                    
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={shareQRCode}
                      disabled={!qrCodeData}
                    >
                      <FaShareAlt className="me-1" />
                      Share
                    </Button>
                    
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={downloadQRCode}
                      disabled={!qrCodeData}
                    >
                      <FaDownload className="me-1" />
                      Download
                    </Button>
                    
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={regenerateQRCode}
                      disabled={isLoadingQR}
                    >
                      <FaRedo className="me-1" />
                      {isLoadingQR ? "Generating..." : "Regenerate"}
                    </Button>
                  </div>

                  <Alert variant="warning" className="mt-3 mb-0">
                    <small>
                      <strong>Security Note:</strong> Keep your QR code private. 
                      Only show it to authorized booth operators at official collection points.
                    </small>
                  </Alert>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm mt-4">
            <Card.Header>
              <h6 className="mb-0">Recent Collections</h6>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-3">
                <p className="text-muted">No recent collections found.</p>
                <Button variant="outline-primary" href="/submit-waste">
                  Start Collecting Waste
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaQrcode className="me-2" />
            Your Collection QR Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="bg-light border rounded p-4 d-inline-block mb-3">
            <div 
              style={{ 
                width: '200px', 
                height: '200px',
                background: 'repeating-linear-gradient(45deg, #000 0px, #000 15px, #fff 15px, #fff 30px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            >
              QR CODE<br/>
              {qrCodeData?.qrCode?.slice(-8)}
            </div>
          </div>
          
          <h6>Show this to booth operators</h6>
          <p className="text-muted small mb-3">
            Code: <code>{qrCodeData?.qrCode}</code>
          </p>
          
          <div className="d-flex justify-content-center gap-2">
            <Button variant="success" onClick={copyQRCode}>
              <FaCopy className="me-1" />
              Copy
            </Button>
            <Button variant="primary" onClick={downloadQRCode}>
              <FaDownload className="me-1" />
              Download
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProfilePage;