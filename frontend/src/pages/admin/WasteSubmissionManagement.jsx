import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Modal,
  Badge,
  Dropdown,
  Pagination,
  Alert,
  Spinner,
  Image,
  ProgressBar,
  ButtonGroup,
  Accordion
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaCheck,
  FaTimes,
  FaDownload,
  FaRecycle,
  FaUser,
  FaMapMarkerAlt,
  FaCalendar,
  FaWeight,
  FaCoins,
  FaCamera,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFileAlt,
  FaHistory,
  FaThumbsUp,
  FaThumbsDown
} from 'react-icons/fa';

const WasteSubmissionManagement = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWasteType, setFilterWasteType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortField, setSortField] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [submissionsPerPage] = useState(10);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    notes: '',
    adjustedWeight: '',
    adjustedPoints: '',
    qualityScore: 5
  });

  // Mock data - replace with API calls
  const mockSubmissions = [
    {
      id: 1,
      user: {
        id: 1,
        name: 'Rajesh Sharma',
        email: 'rajesh.sharma@email.com',
        rank: 'Silver'
      },
      booth: {
        id: 1,
        name: 'Collection Booth #12',
        location: 'Sector 15, Noida'
      },
      wasteType: 'plastic',
      wasteTypeLabel: 'Plastic',
      weight: 2.5,
      images: [
        'https://via.placeholder.com/300x200?text=Plastic+Waste+1',
        'https://via.placeholder.com/300x200?text=Plastic+Waste+2'
      ],
      pointsEarned: 25,
      status: 'pending',
      submittedAt: '2024-01-21T10:30:00Z',
      reviewedAt: null,
      reviewedBy: null,
      notes: 'Mixed plastic bottles and containers',
      qualityScore: null,
      gpsLocation: { lat: 28.5355, lng: 77.3910 },
      verified: false
    },
    {
      id: 2,
      user: {
        id: 2,
        name: 'Priya Patel',
        email: 'priya.patel@email.com',
        rank: 'Gold'
      },
      booth: {
        id: 2,
        name: 'Collection Booth #8',
        location: 'MG Road, Pune'
      },
      wasteType: 'paper',
      wasteTypeLabel: 'Paper',
      weight: 1.8,
      images: [
        'https://via.placeholder.com/300x200?text=Paper+Waste'
      ],
      pointsEarned: 9,
      status: 'approved',
      submittedAt: '2024-01-21T09:15:00Z',
      reviewedAt: '2024-01-21T11:20:00Z',
      reviewedBy: 'Admin User',
      notes: 'Clean newspaper and magazines',
      qualityScore: 8,
      gpsLocation: { lat: 18.5204, lng: 73.8567 },
      verified: true
    },
    {
      id: 3,
      user: {
        id: 3,
        name: 'Amit Kumar',
        email: 'amit.kumar@email.com',
        rank: 'Bronze'
      },
      booth: {
        id: 1,
        name: 'Collection Booth #12',
        location: 'Sector 15, Noida'
      },
      wasteType: 'metal',
      wasteTypeLabel: 'Metal',
      weight: 0.5,
      images: [
        'https://via.placeholder.com/300x200?text=Metal+Cans'
      ],
      pointsEarned: 7,
      status: 'rejected',
      submittedAt: '2024-01-21T08:45:00Z',
      reviewedAt: '2024-01-21T10:30:00Z',
      reviewedBy: 'Admin User',
      notes: 'Contaminated items, not recyclable',
      qualityScore: 2,
      gpsLocation: { lat: 28.5355, lng: 77.3910 },
      verified: false
    },
    {
      id: 4,
      user: {
        id: 4,
        name: 'Sneha Reddy',
        email: 'sneha.reddy@email.com',
        rank: 'Platinum'
      },
      booth: {
        id: 3,
        name: 'Collection Booth #25',
        location: 'Banjara Hills, Hyderabad'
      },
      wasteType: 'electronic',
      wasteTypeLabel: 'E-Waste',
      weight: 3.2,
      images: [
        'https://via.placeholder.com/300x200?text=E-Waste+Items'
      ],
      pointsEarned: 80,
      status: 'pending',
      submittedAt: '2024-01-21T07:30:00Z',
      reviewedAt: null,
      reviewedBy: null,
      notes: 'Old mobile phones and chargers',
      qualityScore: null,
      gpsLocation: { lat: 17.4126, lng: 78.4482 },
      verified: false
    }
  ];

  useEffect(() => {
    // Simulate API call
    const loadSubmissions = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmissions(mockSubmissions);
      setFilteredSubmissions(mockSubmissions);
      setIsLoading(false);
    };

    loadSubmissions();
  }, []);

  // Filter and search submissions
  useEffect(() => {
    let filtered = submissions.filter(submission => {
      const matchesSearch = submission.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.wasteTypeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.booth.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
      const matchesWasteType = filterWasteType === 'all' || submission.wasteType === filterWasteType;
      
      // Date range filter
      let matchesDateRange = true;
      if (filterDateRange !== 'all') {
        const submissionDate = new Date(submission.submittedAt);
        const today = new Date();
        const daysDiff = Math.floor((today - submissionDate) / (1000 * 60 * 60 * 24));
        
        switch (filterDateRange) {
          case 'today':
            matchesDateRange = daysDiff === 0;
            break;
          case 'week':
            matchesDateRange = daysDiff <= 7;
            break;
          case 'month':
            matchesDateRange = daysDiff <= 30;
            break;
          default:
            matchesDateRange = true;
        }
      }
      
      return matchesSearch && matchesStatus && matchesWasteType && matchesDateRange;
    });

    // Sort submissions
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'submittedAt' || sortField === 'reviewedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortField === 'user.name') {
        aValue = a.user.name.toLowerCase();
        bValue = b.user.name.toLowerCase();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSubmissions(filtered);
    setCurrentPage(1);
  }, [submissions, searchTerm, filterStatus, filterWasteType, filterDateRange, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortOrder === 'asc' ? <FaSortUp className="text-primary" /> : <FaSortDown className="text-primary" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FaCheckCircle />;
      case 'rejected': return <FaTimes />;
      case 'pending': return <FaClock />;
      default: return <FaExclamationTriangle />;
    }
  };

  const getWasteTypeIcon = (wasteType) => {
    switch (wasteType) {
      case 'plastic': return '♻️';
      case 'paper': return '📄';
      case 'metal': return '🥫';
      case 'glass': return '🍶';
      case 'organic': return '🍃';
      case 'electronic': return '📱';
      case 'textile': return '👕';
      default: return '🗑️';
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
  };

  const handleReviewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setReviewForm({
      status: 'approved',
      notes: '',
      adjustedWeight: submission.weight.toString(),
      adjustedPoints: submission.pointsEarned.toString(),
      qualityScore: 5
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    // Add review API call here
    console.log('Reviewing submission:', selectedSubmission.id, reviewForm);
    setShowReviewModal(false);
  };

  const handleBulkAction = (action) => {
    if (selectedSubmissions.length === 0) return;
    // Add bulk action API call here
    console.log('Bulk action:', action, selectedSubmissions);
    setSelectedSubmissions([]);
  };

  const handleSelectSubmission = (submissionId) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAllSubmissions = () => {
    if (selectedSubmissions.length === currentSubmissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(currentSubmissions.map(s => s.id));
    }
  };

  // Pagination
  const indexOfLastSubmission = currentPage * submissionsPerPage;
  const indexOfFirstSubmission = indexOfLastSubmission - submissionsPerPage;
  const currentSubmissions = filteredSubmissions.slice(indexOfFirstSubmission, indexOfLastSubmission);
  const totalPages = Math.ceil(filteredSubmissions.length / submissionsPerPage);

  // Statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    totalWeight: submissions.reduce((sum, s) => sum + s.weight, 0),
    totalPoints: submissions.reduce((sum, s) => sum + s.pointsEarned, 0)
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Waste Submission Management</h2>
          <p className="text-muted mb-0">Review and approve waste submissions</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm">
            <FaDownload className="me-1" />
            Export
          </Button>
          {selectedSubmissions.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="primary" size="sm">
                Bulk Actions ({selectedSubmissions.length})
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleBulkAction('approve')}>
                  <FaCheck className="me-2 text-success" />
                  Approve Selected
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleBulkAction('reject')}>
                  <FaTimes className="me-2 text-danger" />
                  Reject Selected
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-primary mb-1">{stats.total}</div>
              <small className="text-muted">Total Submissions</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-warning mb-1">{stats.pending}</div>
              <small className="text-muted">Pending Review</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-success mb-1">{stats.approved}</div>
              <small className="text-muted">Approved</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-danger mb-1">{stats.rejected}</div>
              <small className="text-muted">Rejected</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-info mb-1">{stats.totalWeight.toFixed(1)}kg</div>
              <small className="text-muted">Total Weight</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-secondary mb-1">{stats.totalPoints}</div>
              <small className="text-muted">Total Points</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterWasteType}
                onChange={(e) => setFilterWasteType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="plastic">Plastic</option>
                <option value="paper">Paper</option>
                <option value="metal">Metal</option>
                <option value="glass">Glass</option>
                <option value="organic">Organic</option>
                <option value="electronic">E-Waste</option>
                <option value="textile">Textile</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <span className="text-muted">
                Showing {indexOfFirstSubmission + 1}-{Math.min(indexOfLastSubmission, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Submissions Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Loading submissions...</div>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0">
                    <Form.Check
                      type="checkbox"
                      checked={selectedSubmissions.length === currentSubmissions.length && currentSubmissions.length > 0}
                      onChange={handleSelectAllSubmissions}
                    />
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('user.name')}
                  >
                    User {getSortIcon('user.name')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('wasteType')}
                  >
                    Waste Type {getSortIcon('wasteType')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('weight')}
                  >
                    Weight {getSortIcon('weight')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('pointsEarned')}
                  >
                    Points {getSortIcon('pointsEarned')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('submittedAt')}
                  >
                    Submitted {getSortIcon('submittedAt')}
                  </th>
                  <th className="border-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="border-0 py-3">
                      <Form.Check
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={() => handleSelectSubmission(submission.id)}
                      />
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                             style={{width: '40px', height: '40px'}}>
                          <span className="text-white fw-bold">
                            {submission.user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="fw-medium">{submission.user.name}</div>
                          <small className="text-muted">{submission.user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <span className="me-2">{getWasteTypeIcon(submission.wasteType)}</span>
                        <div>
                          <div className="fw-medium">{submission.wasteTypeLabel}</div>
                          <small className="text-muted">{submission.booth.name}</small>
                        </div>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <FaWeight className="text-muted me-1" />
                        <span className="fw-medium">{submission.weight}kg</span>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <FaCoins className="text-warning me-1" />
                        <span className="fw-medium">{submission.pointsEarned}</span>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <Badge bg={getStatusColor(submission.status)} className="d-flex align-items-center w-fit">
                        {getStatusIcon(submission.status)}
                        <span className="ms-1 text-capitalize">{submission.status}</span>
                      </Badge>
                    </td>
                    <td className="border-0 py-3">
                      <div>
                        <div>{new Date(submission.submittedAt).toLocaleDateString()}</div>
                        <small className="text-muted">
                          {new Date(submission.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </small>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <ButtonGroup size="sm">
                        <Button variant="outline-primary" onClick={() => handleViewSubmission(submission)}>
                          <FaEye />
                        </Button>
                        {submission.status === 'pending' && (
                          <Button variant="outline-success" onClick={() => handleReviewSubmission(submission)}>
                            <FaCheck />
                          </Button>
                        )}
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            />
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (page === currentPage || 
                  page === 1 || 
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <Pagination.Ellipsis key={page} />;
              }
              return null;
            })}
            
            <Pagination.Next 
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}

      {/* Submission Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Submission Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSubmission && (
            <Row>
              <Col md={6}>
                {/* User Info */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-primary text-white">
                    <FaUser className="me-2" />
                    User Information
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{width: '50px', height: '50px'}}>
                        <span className="text-white fw-bold h5 mb-0">
                          {selectedSubmission.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="fw-bold">{selectedSubmission.user.name}</div>
                        <div className="text-muted">{selectedSubmission.user.email}</div>
                        <Badge bg="info">{selectedSubmission.user.rank}</Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* Submission Info */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-success text-white">
                    <FaRecycle className="me-2" />
                    Submission Details
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Waste Type</small>
                          <div className="d-flex align-items-center">
                            <span className="me-2">{getWasteTypeIcon(selectedSubmission.wasteType)}</span>
                            <span className="fw-medium">{selectedSubmission.wasteTypeLabel}</span>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Weight</small>
                          <div className="fw-medium">{selectedSubmission.weight}kg</div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Points Earned</small>
                          <div className="fw-medium text-warning">
                            <FaCoins className="me-1" />
                            {selectedSubmission.pointsEarned}
                          </div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Status</small>
                          <div>
                            <Badge bg={getStatusColor(selectedSubmission.status)} className="text-capitalize">
                              {selectedSubmission.status}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    {selectedSubmission.notes && (
                      <div className="mt-3">
                        <small className="text-muted">Notes</small>
                        <div className="border rounded p-2 bg-white">
                          {selectedSubmission.notes}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Location Info */}
                <Card className="border-0 bg-light">
                  <Card.Header className="bg-info text-white">
                    <FaMapMarkerAlt className="me-2" />
                    Location & Booth
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <small className="text-muted">Collection Booth</small>
                      <div className="fw-medium">{selectedSubmission.booth.name}</div>
                      <div className="text-muted">{selectedSubmission.booth.location}</div>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">GPS Coordinates</small>
                      <div className="font-monospace">
                        {selectedSubmission.gpsLocation.lat}, {selectedSubmission.gpsLocation.lng}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                {/* Images */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-warning text-dark">
                    <FaCamera className="me-2" />
                    Submission Images
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {selectedSubmission.images.map((image, index) => (
                        <Col sm={6} key={index} className="mb-3">
                          <Image
                            src={image}
                            alt={`Waste submission ${index + 1}`}
                            fluid
                            rounded
                            className="border"
                            style={{height: '150px', width: '100%', objectFit: 'cover'}}
                          />
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>

                {/* Review Info */}
                {selectedSubmission.reviewedAt && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Header className="bg-secondary text-white">
                      <FaHistory className="me-2" />
                      Review Information
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <small className="text-muted">Reviewed By</small>
                        <div className="fw-medium">{selectedSubmission.reviewedBy}</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Review Date</small>
                        <div>{new Date(selectedSubmission.reviewedAt).toLocaleString()}</div>
                      </div>
                      {selectedSubmission.qualityScore && (
                        <div className="mb-2">
                          <small className="text-muted">Quality Score</small>
                          <div>
                            <ProgressBar 
                              now={selectedSubmission.qualityScore * 10} 
                              label={`${selectedSubmission.qualityScore}/10`}
                              variant={selectedSubmission.qualityScore >= 7 ? 'success' : selectedSubmission.qualityScore >= 4 ? 'warning' : 'danger'}
                            />
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {/* Timeline */}
                <Card className="border-0 bg-light">
                  <Card.Header className="bg-dark text-white">
                    <FaHistory className="me-2" />
                    Timeline
                  </Card.Header>
                  <Card.Body>
                    <div className="timeline">
                      <div className="timeline-item">
                        <div className="timeline-marker bg-primary"></div>
                        <div className="timeline-content">
                          <div className="fw-medium">Submission Created</div>
                          <small className="text-muted">
                            {new Date(selectedSubmission.submittedAt).toLocaleString()}
                          </small>
                        </div>
                      </div>
                      {selectedSubmission.reviewedAt && (
                        <div className="timeline-item">
                          <div className={`timeline-marker bg-${getStatusColor(selectedSubmission.status)}`}></div>
                          <div className="timeline-content">
                            <div className="fw-medium">
                              Submission {selectedSubmission.status === 'approved' ? 'Approved' : 'Rejected'}
                            </div>
                            <small className="text-muted">
                              {new Date(selectedSubmission.reviewedAt).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedSubmission?.status === 'pending' && (
            <>
              <Button variant="success" onClick={() => {
                setShowDetailsModal(false);
                handleReviewSubmission(selectedSubmission);
              }}>
                <FaCheck className="me-1" />
                Review Submission
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Review Submission</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReviewSubmit}>
          <Modal.Body>
            {selectedSubmission && (
              <Row>
                <Col md={6}>
                  <Alert variant="info">
                    <strong>User:</strong> {selectedSubmission.user.name}<br/>
                    <strong>Waste Type:</strong> {selectedSubmission.wasteTypeLabel}<br/>
                    <strong>Weight:</strong> {selectedSubmission.weight}kg<br/>
                    <strong>Points:</strong> {selectedSubmission.pointsEarned}
                  </Alert>

                  <Form.Group className="mb-3">
                    <Form.Label>Review Decision</Form.Label>
                    <div>
                      <Form.Check
                        type="radio"
                        id="approve"
                        name="status"
                        label="Approve Submission"
                        value="approved"
                        checked={reviewForm.status === 'approved'}
                        onChange={(e) => setReviewForm(prev => ({...prev, status: e.target.value}))}
                        className="text-success"
                      />
                      <Form.Check
                        type="radio"
                        id="reject"
                        name="status"
                        label="Reject Submission"
                        value="rejected"
                        checked={reviewForm.status === 'rejected'}
                        onChange={(e) => setReviewForm(prev => ({...prev, status: e.target.value}))}
                        className="text-danger"
                      />
                    </div>
                  </Form.Group>

                  <Row>
                    <Col sm={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Adjusted Weight (kg)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.1"
                          min="0"
                          value={reviewForm.adjustedWeight}
                          onChange={(e) => setReviewForm(prev => ({...prev, adjustedWeight: e.target.value}))}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Adjusted Points</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={reviewForm.adjustedPoints}
                          onChange={(e) => setReviewForm(prev => ({...prev, adjustedPoints: e.target.value}))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Quality Score (1-10)</Form.Label>
                    <Form.Range
                      min={1}
                      max={10}
                      value={reviewForm.qualityScore}
                      onChange={(e) => setReviewForm(prev => ({...prev, qualityScore: parseInt(e.target.value)}))}
                    />
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">Poor (1)</small>
                      <strong>{reviewForm.qualityScore}/10</strong>
                      <small className="text-muted">Excellent (10)</small>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Review Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={reviewForm.notes}
                      onChange={(e) => setReviewForm(prev => ({...prev, notes: e.target.value}))}
                      placeholder="Enter review notes..."
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <strong>Submission Images:</strong>
                  </div>
                  <Row>
                    {selectedSubmission.images.map((image, index) => (
                      <Col sm={6} key={index} className="mb-3">
                        <Image
                          src={image}
                          alt={`Waste submission ${index + 1}`}
                          fluid
                          rounded
                          className="border"
                          style={{height: '120px', width: '100%', objectFit: 'cover'}}
                        />
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={reviewForm.status === 'approved' ? 'success' : 'danger'} 
              type="submit"
            >
              {reviewForm.status === 'approved' ? (
                <>
                  <FaThumbsUp className="me-1" />
                  Approve Submission
                </>
              ) : (
                <>
                  <FaThumbsDown className="me-1" />
                  Reject Submission
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        
        .cursor-pointer:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .w-fit {
          width: fit-content;
        }
        
        .timeline {
          position: relative;
          padding-left: 2rem;
        }
        
        .timeline::before {
          content: '';
          position: absolute;
          left: 0.75rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #dee2e6;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 1.5rem;
        }
        
        .timeline-marker {
          position: absolute;
          left: -1.75rem;
          top: 0.25rem;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }
        
        .timeline-content {
          padding-left: 1rem;
        }
      `}</style>
    </div>
  );
};

export default WasteSubmissionManagement;
