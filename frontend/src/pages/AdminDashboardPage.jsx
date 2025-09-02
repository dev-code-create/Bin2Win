import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Badge,
  Modal,
} from "react-bootstrap";
import {
  FaQrcode,
  FaUser,
  FaWeight,
  FaRecycle,
  FaCoins,
  FaHistory,
  FaSignOutAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import QRCodeScanner from "../components/QRCodeScanner";
import apiService from "../services/api";

const AdminDashboardPage = () => {
  const { user, userType, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [scannedUser, setScannedUser] = useState(null);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Collection form state
  const [collectionForm, setCollectionForm] = useState({
    wasteType: "",
    quantity: "",
    notes: "",
  });

  // Waste types with point values
  const wasteTypes = [
    { value: "plastic", label: "Plastic", points: 10, icon: "♻️" },
    { value: "paper", label: "Paper", points: 5, icon: "📄" },
    { value: "metal", label: "Metal", points: 15, icon: "🥫" },
    { value: "glass", label: "Glass", points: 8, icon: "🍶" },
    { value: "organic", label: "Organic", points: 3, icon: "🍃" },
    { value: "electronic", label: "E-Waste", points: 25, icon: "📱" },
    { value: "textile", label: "Textile", points: 7, icon: "👕" },
  ];

    // Handle QR scan from the scanner component
  const handleQRScan = async (qrCode) => {
    if (!qrCode.trim()) {
      toast.error("Invalid QR code");
      return;
    }

    // Debug auth state
    console.log("Admin token check:", {
      token: localStorage.getItem("authToken"),
      userType: localStorage.getItem("userType"),
    });

    setIsLoading(true);
    try {
      const response = await apiService.scanUserQR(qrCode);

      if (response.success) {
        const userData = {
          id: response.data.user.id,
          name: response.data.user.name,
          username: response.data.user.username,
          greenCredits: response.data.user.greenCredits,
          currentRank: response.data.user.currentRank,
          totalWasteSubmitted: response.data.user.totalWasteSubmitted,
          qrCode: qrCode,
          booth: response.data.booth,
          admin: response.data.admin
        };

        setScannedUser(userData);
        setShowCollectionForm(true);
        toast.success(`User ${userData.name} scanned successfully!`);
      } else {
        throw new Error(response.message || "Invalid QR code");
      }
    } catch (error) {
      toast.error(error.message || "Failed to scan QR code. Please try again.");
      console.error("QR scan error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle waste collection submission
  const handleCollectionSubmit = async () => {
    if (!collectionForm.wasteType || !collectionForm.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(collectionForm.quantity) <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setIsLoading(true);
    try {
      const selectedWasteType = wasteTypes.find(
        (type) => type.value === collectionForm.wasteType
      );
      const quantity = parseFloat(collectionForm.quantity);

      const submissionData = {
        userId: scannedUser.id,
        boothId: scannedUser.booth?.id,
        wasteType: collectionForm.wasteType,
        quantity: quantity,
        notes: collectionForm.notes
      };

      const response = await apiService.adminSubmitWaste(submissionData);

      if (response.success) {
        const pointsEarned = response.data.pointsEarned || (quantity * selectedWasteType.points);
        
        toast.success(
          `✅ Collection Recorded!\n` +
            `User: ${scannedUser.name}\n` +
            `${quantity}kg ${selectedWasteType.label} = ${pointsEarned} points`
        );

        // Update scanned user's credits for display
        setScannedUser(prev => ({
          ...prev,
          greenCredits: prev.greenCredits + pointsEarned
        }));

        // Reset form
        setCollectionForm({ wasteType: "", quantity: "", notes: "" });
        setScannedUser(null);
        setShowCollectionForm(false);
      } else {
        throw new Error(response.message || "Failed to record collection");
      }
    } catch (error) {
      toast.error(error.message || "Failed to record collection. Please try again.");
      console.error("Collection submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  // Redirect if not admin
  if (userType !== "admin") {
    navigate("/admin/login");
    return null;
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-primary text-white py-3 shadow">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h3 className="mb-0">
                <FaQrcode className="me-2" />
                Admin Dashboard
              </h3>
              <small>Simhastha 2028 - Booth Operator Portal</small>
            </Col>
            <Col xs="auto">
              <div className="text-end">
                <div className="text-light">
                  Welcome, <strong>{user?.fullName || user?.name}</strong>
                </div>
                <small className="text-light opacity-75">
                  {user?.booth?.name || "Main Collection Booth"}
                </small>
              </div>
            </Col>
            <Col xs="auto">
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                <FaSignOutAlt className="me-1" />
                Logout
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        <Row>
          {/* QR Scanner Section */}
          <Col lg={8}>
            <QRCodeScanner
              onScan={handleQRScan}
              onError={(error) => toast.error(error)}
              isLoading={isLoading}
              placeholder="Enter QR code (e.g., SIMHASTHA_USER_A1B2C3D4E5F6G7H8)"
              className="shadow-sm"
            />

            {/* User Info Display */}
            {scannedUser && (
              <Card className="shadow-sm mt-3">
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">
                    <FaUser className="me-2" />
                    Scanned User Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h5>{scannedUser.name}</h5>
                      <p className="text-muted mb-1">@{scannedUser.username}</p>
                      <Badge bg="primary">{scannedUser.currentRank}</Badge>
                    </Col>
                    <Col md={6} className="text-md-end">
                      <div className="text-success">
                        <FaCoins className="me-1" />
                        <strong>{scannedUser.greenCredits} Points</strong>
                      </div>
                      <small className="text-muted">Current Balance</small>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Quick Actions */}
          <Col lg={4}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="outline-primary">
                    <FaHistory className="me-2" />
                    View Collection History
                  </Button>
                  <Button variant="outline-success">
                    <FaRecycle className="me-2" />
                    Waste Type Guide
                  </Button>
                  <Button variant="outline-info">
                    <FaWeight className="me-2" />
                    Daily Statistics
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Waste Types Reference */}
            <Card className="shadow-sm mt-3">
              <Card.Header>
                <h6 className="mb-0">Point Values</h6>
              </Card.Header>
              <Card.Body>
                {wasteTypes.map((type) => (
                  <div
                    key={type.value}
                    className="d-flex justify-content-between align-items-center mb-2"
                  >
                    <div>
                      <span className="me-2">{type.icon}</span>
                      <small>{type.label}</small>
                    </div>
                    <Badge bg="secondary">{type.points} pts/kg</Badge>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Collection Form Modal */}
      <Modal
        show={showCollectionForm}
        onHide={() => setShowCollectionForm(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaRecycle className="me-2" />
            Record Waste Collection
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {scannedUser && (
            <Alert variant="info">
              <strong>User:</strong> {scannedUser.name} (@{scannedUser.username}
              )
            </Alert>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Waste Type *</Form.Label>
                  <Form.Select
                    value={collectionForm.wasteType}
                    onChange={(e) =>
                      setCollectionForm((prev) => ({
                        ...prev,
                        wasteType: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select waste type</option>
                    {wasteTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label} ({type.points} pts/kg)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight (kg) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="0.0"
                    value={collectionForm.quantity}
                    onChange={(e) =>
                      setCollectionForm((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Additional notes about the collection..."
                value={collectionForm.notes}
                onChange={(e) =>
                  setCollectionForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </Form.Group>

            {/* Points Preview */}
            {collectionForm.wasteType && collectionForm.quantity && (
              <Alert variant="success">
                <FaCoins className="me-2" />
                <strong>Points to be awarded:</strong>{" "}
                {parseFloat(collectionForm.quantity || 0) *
                  (wasteTypes.find((t) => t.value === collectionForm.wasteType)
                    ?.points || 0)}{" "}
                points
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCollectionForm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleCollectionSubmit}
            disabled={
              isLoading || !collectionForm.wasteType || !collectionForm.quantity
            }
          >
            {isLoading ? (
              "Recording..."
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Record Collection
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
