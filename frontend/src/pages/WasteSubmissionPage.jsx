import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import {
  FaQrcode,
  FaRecycle,
  FaMapMarkerAlt,
  FaCoins,
  FaCamera,
  FaWeightHanging,
} from "react-icons/fa";
import { toast } from "react-toastify";
import QRScanner from "../components/waste/QRScanner";
import { useAuth } from "../contexts/AuthContext";
import useGeolocation from "../hooks/useGeolocation";
import apiService from "../services/api";

const WasteSubmissionPage = () => {
  const { user } = useAuth();
  const { latitude, longitude, error: locationError } = useGeolocation();
  const location = latitude && longitude ? { latitude, longitude } : null;

  const [currentStep, setCurrentStep] = useState(
    user?.qrCode ? "scan" : "form"
  );
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    wasteType: "plastic",
    quantity: 0,
    photos: [],
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const wasteTypes = [
    { value: "plastic", label: "Plastic", color: "primary", pointsPerKg: 10 },
    { value: "paper", label: "Paper", color: "info", pointsPerKg: 8 },
    { value: "metal", label: "Metal", color: "secondary", pointsPerKg: 15 },
    { value: "glass", label: "Glass", color: "success", pointsPerKg: 12 },
    { value: "organic", label: "Organic", color: "warning", pointsPerKg: 5 },
    { value: "electronic", label: "E-Waste", color: "danger", pointsPerKg: 25 },
  ];

  useEffect(() => {
    if (locationError) {
      setError("Location access is required for waste submission verification.");
    }
  }, [locationError]);

  const handleQRScan = async (qrData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.validateBoothQR(qrData);
      
      if (response.success && response.data) {
        setSelectedBooth(response.data);
        setSubmissionData(prev => ({
          ...prev,
          boothId: response.data.id
        }));
        setCurrentStep("form");
        toast.success(`Connected to booth: ${response.data.name}`);
      } else {
        throw new Error(response.message || "Invalid QR code");
      }
    } catch (error) {
      console.error("QR validation error:", error);
      setError(error.message || "Failed to validate QR code. Please try again.");
      toast.error("Invalid booth QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!submissionData.boothId && currentStep === "form") {
      errors.booth = "Please scan a valid booth QR code first";
    }

    if (!submissionData.wasteType) {
      errors.wasteType = "Please select a waste type";
    }

    if (!submissionData.quantity || submissionData.quantity <= 0) {
      errors.quantity = "Please enter a valid quantity";
    } else if (submissionData.quantity > 100) {
      errors.quantity = "Maximum 100kg per submission";
    }

    if (submissionData.photos.length === 0) {
      errors.photos = "Please add at least one photo";
    } else if (submissionData.photos.length > 5) {
      errors.photos = "Maximum 5 photos allowed";
    }

    if (!location) {
      errors.location = "Location is required for verification";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("boothId", submissionData.boothId);
      formData.append("wasteType", submissionData.wasteType);
      formData.append("quantity", submissionData.quantity.toString());
      formData.append("notes", submissionData.notes || "");
      formData.append("location", JSON.stringify(location));

      // Append photos
      submissionData.photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });

      const response = await apiService.submitWaste(formData);

      if (response.success) {
        setCurrentStep("success");
        toast.success("Waste submitted successfully! Points will be credited after verification.");
      } else {
        throw new Error(response.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.message || "Failed to submit waste. Please try again.");
      toast.error("Submission failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + submissionData.photos.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }

    // Validate file sizes (max 5MB each)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error("Each photo must be less than 5MB");
      return;
    }

    setSubmissionData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const removePhoto = (index) => {
    setSubmissionData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const calculatePoints = () => {
    const wasteType = wasteTypes.find(w => w.value === submissionData.wasteType);
    return wasteType ? Math.floor(submissionData.quantity * wasteType.pointsPerKg) : 0;
  };

  const resetForm = () => {
    setCurrentStep("scan");
    setSelectedBooth(null);
    setSubmissionData({
      wasteType: "plastic",
      quantity: 0,
      photos: [],
      notes: "",
    });
    setError(null);
    setValidationErrors({});
  };

  if (currentStep === "scan") {
    return (
      <Container>
        <div className="text-center mb-4">
          <h2 className="fw-bold">
            <FaQrcode className="text-primary me-2" />
            Scan Booth QR Code
          </h2>
          <p className="text-muted">Scan the QR code at the collection booth to start</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <QRScanner
                  onScan={handleQRScan}
                  isLoading={isLoading}
                />
                
                <div className="text-center mt-3">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setCurrentStep("form")}
                    disabled={isLoading}
                  >
                    Skip QR Scan (Manual Entry)
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (currentStep === "success") {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="py-5">
                <FaRecycle size={80} className="text-success mb-4" />
                <h2 className="fw-bold text-success mb-3">Submission Successful!</h2>
                <p className="text-muted mb-4">
                  Your waste submission has been recorded and is pending verification.
                  You'll receive your Green Credits once approved.
                </p>
                
                <div className="bg-light rounded p-4 mb-4">
                  <h5 className="mb-3">Submission Details</h5>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Waste Type:</span>
                    <Badge bg="primary">{submissionData.wasteType}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Quantity:</span>
                    <span>{submissionData.quantity} kg</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Expected Points:</span>
                    <span className="fw-bold text-success">
                      <FaCoins className="me-1" />
                      {calculatePoints()}
                    </span>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Button variant="success" onClick={resetForm}>
                    Submit Another Waste
                  </Button>
                  <Button variant="outline-primary" href="/dashboard">
                    Back to Dashboard
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <div className="text-center mb-4">
        <h2 className="fw-bold">
          <FaRecycle className="text-success me-2" />
          Submit Waste
        </h2>
        <p className="text-muted">Fill in the details to submit your waste</p>
      </div>

      {/* Progress Bar */}
      <Row className="mb-4">
        <Col>
          <ProgressBar>
            <ProgressBar variant="success" now={selectedBooth ? 50 : 25} />
            <ProgressBar variant="warning" now={25} />
          </ProgressBar>
          <div className="d-flex justify-content-between mt-2 small text-muted">
            <span>QR Scan</span>
            <span>Form Details</span>
            <span>Verification</span>
            <span>Complete</span>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Booth Info */}
      {selectedBooth && (
        <Alert variant="success" className="mb-4">
          <div className="d-flex align-items-center">
            <FaMapMarkerAlt className="me-2" />
            <div>
              <strong>Connected to: {selectedBooth.name}</strong>
              <br />
              <small>{selectedBooth.address}</small>
            </div>
          </div>
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Waste Submission Form</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {/* Waste Type Selection */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <FaRecycle className="me-2" />
                    Waste Type *
                  </Form.Label>
                  <Row>
                    {wasteTypes.map((type) => (
                      <Col md={6} lg={4} key={type.value} className="mb-2">
                        <Form.Check
                          type="radio"
                          id={`waste-${type.value}`}
                          name="wasteType"
                          label={
                            <div className="d-flex align-items-center">
                              <Badge bg={type.color} className="me-2">
                                {type.label}
                              </Badge>
                              <small className="text-muted">
                                {type.pointsPerKg} pts/kg
                              </small>
                            </div>
                          }
                          checked={submissionData.wasteType === type.value}
                          onChange={(e) => 
                            setSubmissionData(prev => ({
                              ...prev,
                              wasteType: type.value
                            }))
                          }
                        />
                      </Col>
                    ))}
                  </Row>
                  {validationErrors.wasteType && (
                    <Form.Text className="text-danger">
                      {validationErrors.wasteType}
                    </Form.Text>
                  )}
                </Form.Group>

                {/* Quantity */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <FaWeightHanging className="me-2" />
                    Quantity (kg) *
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={submissionData.quantity}
                    onChange={(e) => 
                      setSubmissionData(prev => ({
                        ...prev,
                        quantity: parseFloat(e.target.value) || 0
                      }))
                    }
                    isInvalid={!!validationErrors.quantity}
                    placeholder="Enter weight in kilograms"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.quantity}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Maximum 100kg per submission
                  </Form.Text>
                </Form.Group>

                {/* Photos */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <FaCamera className="me-2" />
                    Photos *
                  </Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    isInvalid={!!validationErrors.photos}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.photos}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Add 1-5 photos of your waste (max 5MB each)
                  </Form.Text>
                  
                  {submissionData.photos.length > 0 && (
                    <div className="mt-3">
                      <h6>Selected Photos:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {submissionData.photos.map((photo, index) => (
                          <div key={index} className="position-relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Preview ${index + 1}`}
                              className="rounded"
                              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 rounded-circle"
                              style={{ width: '20px', height: '20px', fontSize: '10px' }}
                              onClick={() => removePhoto(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Form.Group>

                {/* Notes */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Additional Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={submissionData.notes}
                    onChange={(e) => 
                      setSubmissionData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))
                    }
                    placeholder="Any additional information about the waste..."
                  />
                </Form.Group>

                {/* Location Status */}
                {location ? (
                  <Alert variant="success" className="mb-4">
                    <FaMapMarkerAlt className="me-2" />
                    Location verified
                  </Alert>
                ) : (
                  <Alert variant="warning" className="mb-4">
                    <FaMapMarkerAlt className="me-2" />
                    Location access required for verification
                  </Alert>
                )}

                {/* Submit Buttons */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="outline-secondary"
                    onClick={resetForm}
                    disabled={isLoading}
                  >
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    variant="success"
                    disabled={isLoading || !location}
                    className="px-4"
                  >
                    {isLoading ? "Submitting..." : "Submit Waste"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Points Preview */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h6 className="mb-0">
                <FaCoins className="text-warning me-2" />
                Points Preview
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <h2 className="text-success fw-bold mb-2">
                  {calculatePoints()}
                </h2>
                <p className="text-muted mb-3">Expected Green Credits</p>
                
                <div className="bg-light rounded p-3 mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Waste Type:</span>
                    <Badge bg="primary">{submissionData.wasteType}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Quantity:</span>
                    <span>{submissionData.quantity} kg</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Rate:</span>
                    <span>
                      {wasteTypes.find(w => w.value === submissionData.wasteType)?.pointsPerKg || 0} pts/kg
                    </span>
                  </div>
                </div>

                <small className="text-muted">
                  Points will be credited after verification by booth operators.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WasteSubmissionPage;
