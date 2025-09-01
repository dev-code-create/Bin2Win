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
  ListGroup,
  InputGroup,
} from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaSearch,
  FaDirections,
  FaPhone,
  FaClock,
  FaFilter,
  FaLocationArrow,
} from "react-icons/fa";
import { toast } from "react-toastify";
import GoogleMapComponent from "../components/maps/GoogleMap";
import useGeolocation from "../hooks/useGeolocation";
import apiService from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";

const BoothLocatorPage = () => {
  const {
    latitude,
    longitude,
    error: locationError,
    getCurrentPosition,
  } = useGeolocation();
  const location = latitude && longitude ? { latitude, longitude } : null;
  const [booths, setBooths] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    fetchBooths();
  }, []);

  useEffect(() => {
    filterBooths();
  }, [booths, searchTerm, statusFilter]);

  useEffect(() => {
    if (locationError) {
      setError("Location access would help show nearby booths");
    }
  }, [locationError]);

  const fetchBooths = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getCollectionBooths();
      
      if (response.success && response.data) {
        setBooths(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch booths");
      }
    } catch (error) {
      console.error("Fetch booths error:", error);
      setError(error.message || "Failed to load collection booths");
      toast.error("Failed to load booths");
    } finally {
      setIsLoading(false);
    }
  };

  const filterBooths = () => {
    let filtered = [...booths];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booth =>
        booth.name.toLowerCase().includes(searchLower) ||
        booth.address.toLowerCase().includes(searchLower) ||
        booth.area.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booth => booth.status === statusFilter);
    }

    // Sort by distance if location is available
    if (location) {
      filtered.sort((a, b) => {
        const distA = calculateDistance(location, a.coordinates);
        const distB = calculateDistance(location, b.coordinates);
        return distA - distB;
      });
    }

    setFilteredBooths(filtered);
  };

  const calculateDistance = (from, to) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (to.latitude - from.latitude) * Math.PI / 180;
    const dLon = (to.longitude - from.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.latitude * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getDirections = (booth) => {
    if (!booth.coordinates) return;
    
    const destination = `${booth.coordinates.latitude},${booth.coordinates.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'busy': return 'warning';
      case 'inactive': return 'danger';
      case 'maintenance': return 'secondary';
      default: return 'light';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Open';
      case 'busy': return 'Busy';
      case 'inactive': return 'Closed';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  const requestLocation = async () => {
    try {
      await getCurrentPosition();
      toast.success("Location updated");
    } catch (error) {
      toast.error("Failed to get location");
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="large" text="Loading collection booths..." />
      </div>
    );
  }

  return (
    <Container fluid>
      <div className="text-center mb-4">
        <h2 className="fw-bold">
          <FaMapMarkerAlt className="text-primary me-2" />
          Find Collection Booths
        </h2>
        <p className="text-muted">Locate nearby waste collection points</p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row>
        {/* Filters and List */}
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Collection Booths</h5>
                <Badge bg="primary">{filteredBooths.length}</Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Search and Filters */}
              <div className="p-3 border-bottom">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search booths..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Row className="g-2">
                  <Col>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      size="sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Open</option>
                      <option value="busy">Busy</option>
                      <option value="inactive">Closed</option>
                    </Form.Select>
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={requestLocation}
                      disabled={!getCurrentPosition}
                    >
                      <FaLocationArrow />
                    </Button>
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowMap(!showMap)}
                    >
                      {showMap ? 'Hide' : 'Show'} Map
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Booth List */}
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {filteredBooths.length === 0 ? (
                  <div className="text-center py-4">
                    <FaMapMarkerAlt size={50} className="text-muted mb-3" />
                    <h6>No booths found</h6>
                    <p className="text-muted mb-0">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your filters'
                        : 'No collection booths available'
                      }
                    </p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {filteredBooths.map((booth) => (
                      <ListGroup.Item
                        key={booth.id}
                        action
                        active={selectedBooth?.id === booth.id}
                        onClick={() => setSelectedBooth(booth)}
                        className="border-0"
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold">{booth.name}</h6>
                            <p className="mb-1 text-muted small">{booth.address}</p>
                            <div className="d-flex align-items-center gap-2">
                              <Badge bg={getStatusColor(booth.status)}>
                                {getStatusText(booth.status)}
                              </Badge>
                              {location && booth.coordinates && (
                                <small className="text-muted">
                                  {formatDistance(calculateDistance(location, booth.coordinates))} away
                                </small>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Operating Hours */}
                        {booth.operatingHours && (
                          <div className="d-flex align-items-center text-muted small mb-2">
                            <FaClock className="me-1" />
                            {booth.operatingHours.open} - {booth.operatingHours.close}
                          </div>
                        )}

                        {/* Contact */}
                        {booth.contactNumber && (
                          <div className="d-flex align-items-center text-muted small mb-2">
                            <FaPhone className="me-1" />
                            {booth.contactNumber}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="d-flex gap-2 mt-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              getDirections(booth);
                            }}
                            disabled={!booth.coordinates}
                          >
                            <FaDirections className="me-1" />
                            Directions
                          </Button>
                          {booth.contactNumber && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${booth.contactNumber}`);
                              }}
                            >
                              <FaPhone className="me-1" />
                              Call
                            </Button>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Map */}
        {showMap && (
          <Col lg={8}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-0">
                <div style={{ height: '700px', minHeight: '400px' }}>
                  <GoogleMapComponent
                    booths={filteredBooths}
                    selectedBooth={selectedBooth}
                    onBoothSelect={setSelectedBooth}
                    userLocation={location}
                    onLocationUpdate={(newLocation) => {
                      // Handle location updates if needed
                    }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Selected Booth Details */}
      {selectedBooth && (
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header>
                <h5 className="mb-0">
                  <FaMapMarkerAlt className="text-primary me-2" />
                  {selectedBooth.name}
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Location Details</h6>
                    <p className="text-muted mb-2">{selectedBooth.address}</p>
                    <p className="text-muted mb-3">{selectedBooth.area}</p>
                    
                    <div className="d-flex align-items-center mb-2">
                      <strong className="me-2">Status:</strong>
                      <Badge bg={getStatusColor(selectedBooth.status)}>
                        {getStatusText(selectedBooth.status)}
                      </Badge>
                    </div>

                    {selectedBooth.operatingHours && (
                      <div className="d-flex align-items-center mb-2">
                        <FaClock className="me-2" />
                        <span>
                          {selectedBooth.operatingHours.open} - {selectedBooth.operatingHours.close}
                        </span>
                      </div>
                    )}

                    {selectedBooth.contactNumber && (
                      <div className="d-flex align-items-center mb-3">
                        <FaPhone className="me-2" />
                        <span>{selectedBooth.contactNumber}</span>
                      </div>
                    )}
                  </Col>

                  <Col md={6}>
                    <h6>Accepted Waste Types</h6>
                    {selectedBooth.acceptedWasteTypes ? (
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {selectedBooth.acceptedWasteTypes.map((type) => (
                          <Badge key={type} bg="secondary" className="text-capitalize">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-3">All waste types accepted</p>
                    )}

                    {selectedBooth.facilities && selectedBooth.facilities.length > 0 && (
                      <>
                        <h6>Facilities</h6>
                        <ul className="list-unstyled mb-3">
                          {selectedBooth.facilities.map((facility, index) => (
                            <li key={index} className="text-muted">
                              • {facility}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Col>
                </Row>

                <div className="d-flex gap-2 mt-3">
                  <Button
                    variant="primary"
                    onClick={() => getDirections(selectedBooth)}
                    disabled={!selectedBooth.coordinates}
                  >
                    <FaDirections className="me-2" />
                    Get Directions
                  </Button>
                  {selectedBooth.contactNumber && (
                    <Button
                      variant="success"
                      onClick={() => window.open(`tel:${selectedBooth.contactNumber}`)}
                    >
                      <FaPhone className="me-2" />
                      Call Booth
                    </Button>
                  )}
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSelectedBooth(null)}
                  >
                    Close Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default BoothLocatorPage;
