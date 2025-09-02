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
  ProgressBar,
  ButtonGroup,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaMapMarkerAlt,
  FaQrcode,
  FaClock,
  FaUsers,
  FaUser,
  FaRecycle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaBatteryFull,
  FaBatteryHalf,
  FaBatteryEmpty,
  FaWifi,
  FaSignal,
  FaCog,
  FaHistory,
  FaChartLine,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaToolbox,
  FaShieldAlt
} from 'react-icons/fa';

const BoothManagement = () => {
  const [booths, setBooths] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [boothsPerPage] = useState(10);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    coordinates: { lat: '', lng: '' },
    capacity: 100,
    operatingHours: { start: '06:00', end: '22:00' },
    operatorName: '',
    operatorPhone: '',
    operatorEmail: '',
    status: 'active',
    region: '',
    wasteTypes: []
  });

  // Mock data - replace with API calls
  const mockBooths = [
    {
      id: 1,
      name: 'Collection Booth #12',
      location: 'Sector 15, Noida',
      address: 'Plot No. 25, Sector 15, Noida, Uttar Pradesh 201301',
      coordinates: { lat: 28.5355, lng: 77.3910 },
      capacity: 100,
      currentLoad: 75,
      operatingHours: { start: '06:00', end: '22:00' },
      operatorName: 'Rajesh Kumar',
      operatorPhone: '+91 9876543210',
      operatorEmail: 'rajesh.kumar@bin2win.com',
      status: 'active',
      region: 'North Delhi',
      wasteTypes: ['plastic', 'paper', 'metal', 'glass'],
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-02-15',
      todaySubmissions: 45,
      totalSubmissions: 1250,
      connectivity: 'online',
      batteryLevel: 85,
      sensors: {
        weight: 'working',
        camera: 'working',
        rfid: 'working'
      },
      qrCode: 'BOOTH_001_SECTOR15_NOIDA',
      createdAt: '2023-12-01'
    },
    {
      id: 2,
      name: 'Collection Booth #8',
      location: 'MG Road, Pune',
      address: '123 MG Road, Camp, Pune, Maharashtra 411001',
      coordinates: { lat: 18.5204, lng: 73.8567 },
      capacity: 150,
      currentLoad: 120,
      operatingHours: { start: '05:30', end: '23:00' },
      operatorName: 'Priya Sharma',
      operatorPhone: '+91 9876543211',
      operatorEmail: 'priya.sharma@bin2win.com',
      status: 'active',
      region: 'Maharashtra',
      wasteTypes: ['plastic', 'paper', 'organic', 'electronic'],
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-02-10',
      todaySubmissions: 67,
      totalSubmissions: 2340,
      connectivity: 'online',
      batteryLevel: 92,
      sensors: {
        weight: 'working',
        camera: 'error',
        rfid: 'working'
      },
      qrCode: 'BOOTH_002_MGROAD_PUNE',
      createdAt: '2023-11-15'
    },
    {
      id: 3,
      name: 'Collection Booth #25',
      location: 'Banjara Hills, Hyderabad',
      address: 'Road No. 10, Banjara Hills, Hyderabad, Telangana 500034',
      coordinates: { lat: 17.4126, lng: 78.4482 },
      capacity: 200,
      currentLoad: 45,
      operatingHours: { start: '06:00', end: '22:30' },
      operatorName: 'Amit Singh',
      operatorPhone: '+91 9876543212',
      operatorEmail: 'amit.singh@bin2win.com',
      status: 'maintenance',
      region: 'Telangana',
      wasteTypes: ['plastic', 'metal', 'glass', 'textile'],
      lastMaintenance: '2024-01-20',
      nextMaintenance: '2024-02-20',
      todaySubmissions: 12,
      totalSubmissions: 890,
      connectivity: 'offline',
      batteryLevel: 15,
      sensors: {
        weight: 'maintenance',
        camera: 'working',
        rfid: 'error'
      },
      qrCode: 'BOOTH_003_BANJARA_HYDERABAD',
      createdAt: '2023-12-20'
    },
    {
      id: 4,
      name: 'Collection Booth #7',
      location: 'Koramangala, Bangalore',
      address: '80 Feet Road, Koramangala 4th Block, Bangalore, Karnataka 560034',
      coordinates: { lat: 12.9352, lng: 77.6245 },
      capacity: 120,
      currentLoad: 98,
      operatingHours: { start: '06:00', end: '22:00' },
      operatorName: 'Sneha Reddy',
      operatorPhone: '+91 9876543213',
      operatorEmail: 'sneha.reddy@bin2win.com',
      status: 'full',
      region: 'Karnataka',
      wasteTypes: ['plastic', 'paper', 'metal', 'electronic'],
      lastMaintenance: '2024-01-18',
      nextMaintenance: '2024-02-18',
      todaySubmissions: 34,
      totalSubmissions: 1560,
      connectivity: 'online',
      batteryLevel: 78,
      sensors: {
        weight: 'working',
        camera: 'working',
        rfid: 'working'
      },
      qrCode: 'BOOTH_004_KORAMANGALA_BANGALORE',
      createdAt: '2023-11-30'
    }
  ];

  const wasteTypeOptions = [
    { value: 'plastic', label: 'Plastic', icon: '♻️' },
    { value: 'paper', label: 'Paper', icon: '📄' },
    { value: 'metal', label: 'Metal', icon: '🥫' },
    { value: 'glass', label: 'Glass', icon: '🍶' },
    { value: 'organic', label: 'Organic', icon: '🍃' },
    { value: 'electronic', label: 'E-Waste', icon: '📱' },
    { value: 'textile', label: 'Textile', icon: '👕' }
  ];

  useEffect(() => {
    // Simulate API call
    const loadBooths = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBooths(mockBooths);
      setFilteredBooths(mockBooths);
      setIsLoading(false);
    };

    loadBooths();
  }, []);

  // Filter and search booths
  useEffect(() => {
    let filtered = booths.filter(booth => {
      const matchesSearch = booth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booth.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booth.operatorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || booth.status === filterStatus;
      const matchesRegion = filterRegion === 'all' || booth.region === filterRegion;
      
      return matchesSearch && matchesStatus && matchesRegion;
    });

    // Sort booths
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'currentLoad') {
        aValue = (a.currentLoad / a.capacity) * 100;
        bValue = (b.currentLoad / b.capacity) * 100;
      } else if (sortField === 'createdAt' || sortField === 'lastMaintenance') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
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

    setFilteredBooths(filtered);
    setCurrentPage(1);
  }, [booths, searchTerm, filterStatus, filterRegion, sortField, sortOrder]);

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
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'warning';
      case 'full': return 'danger';
      case 'error': return 'danger';
      default: return 'dark';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaCheckCircle />;
      case 'inactive': return <FaTimes />;
      case 'maintenance': return <FaToolbox />;
      case 'full': return <FaExclamationTriangle />;
      case 'error': return <FaTimes />;
      default: return <FaCheckCircle />;
    }
  };

  const getCapacityColor = (current, total) => {
    const percentage = (current / total) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'info';
    return 'success';
  };

  const getBatteryIcon = (level) => {
    if (level >= 75) return <FaBatteryFull className="text-success" />;
    if (level >= 25) return <FaBatteryHalf className="text-warning" />;
    return <FaBatteryEmpty className="text-danger" />;
  };

  const getSensorStatusColor = (status) => {
    switch (status) {
      case 'working': return 'success';
      case 'error': return 'danger';
      case 'maintenance': return 'warning';
      default: return 'secondary';
    }
  };

  const handleAddBooth = () => {
    setFormData({
      name: '',
      location: '',
      address: '',
      coordinates: { lat: '', lng: '' },
      capacity: 100,
      operatingHours: { start: '06:00', end: '22:00' },
      operatorName: '',
      operatorPhone: '',
      operatorEmail: '',
      status: 'active',
      region: '',
      wasteTypes: []
    });
    setShowAddModal(true);
  };

  const handleEditBooth = (booth) => {
    setSelectedBooth(booth);
    setFormData({
      name: booth.name,
      location: booth.location,
      address: booth.address,
      coordinates: booth.coordinates,
      capacity: booth.capacity,
      operatingHours: booth.operatingHours,
      operatorName: booth.operatorName,
      operatorPhone: booth.operatorPhone,
      operatorEmail: booth.operatorEmail,
      status: booth.status,
      region: booth.region,
      wasteTypes: booth.wasteTypes
    });
    setShowEditModal(true);
  };

  const handleDeleteBooth = (booth) => {
    setSelectedBooth(booth);
    setShowDeleteModal(true);
  };

  const handleViewBooth = (booth) => {
    setSelectedBooth(booth);
    setShowDetailsModal(true);
  };

  const handleShowQR = (booth) => {
    setSelectedBooth(booth);
    setShowQRModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // Add form validation and API call here
    console.log('Form submitted:', formData);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleDeleteConfirm = async () => {
    // Add delete API call here
    console.log('Deleting booth:', selectedBooth.id);
    setShowDeleteModal(false);
  };

  const handleStatusChange = async (boothId, newStatus) => {
    // Add status update API call here
    console.log('Changing status:', boothId, newStatus);
  };

  // Pagination
  const indexOfLastBooth = currentPage * boothsPerPage;
  const indexOfFirstBooth = indexOfLastBooth - boothsPerPage;
  const currentBooths = filteredBooths.slice(indexOfFirstBooth, indexOfLastBooth);
  const totalPages = Math.ceil(filteredBooths.length / boothsPerPage);

  // Statistics
  const stats = {
    total: booths.length,
    active: booths.filter(b => b.status === 'active').length,
    maintenance: booths.filter(b => b.status === 'maintenance').length,
    full: booths.filter(b => b.status === 'full').length,
    offline: booths.filter(b => b.connectivity === 'offline').length,
    avgCapacity: booths.reduce((sum, b) => sum + (b.currentLoad / b.capacity) * 100, 0) / booths.length
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Booth Management</h2>
          <p className="text-muted mb-0">Monitor and manage collection booths</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm">
            <FaDownload className="me-1" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddBooth}>
            <FaPlus className="me-1" />
            Add Booth
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-primary mb-1">{stats.total}</div>
              <small className="text-muted">Total Booths</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-success mb-1">{stats.active}</div>
              <small className="text-muted">Active</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-warning mb-1">{stats.maintenance}</div>
              <small className="text-muted">Maintenance</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-danger mb-1">{stats.full}</div>
              <small className="text-muted">Full</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-secondary mb-1">{stats.offline}</div>
              <small className="text-muted">Offline</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-info mb-1">{stats.avgCapacity.toFixed(1)}%</div>
              <small className="text-muted">Avg Capacity</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
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
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="full">Full</option>
                <option value="error">Error</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <option value="all">All Regions</option>
                <option value="North Delhi">North Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Telangana">Telangana</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted">
                Showing {indexOfFirstBooth + 1}-{Math.min(indexOfLastBooth, filteredBooths.length)} of {filteredBooths.length} booths
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Booths Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Loading booths...</div>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Booth {getSortIcon('name')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('currentLoad')}
                  >
                    Capacity {getSortIcon('currentLoad')}
                  </th>
                  <th className="border-0">Operator</th>
                  <th className="border-0">Connectivity</th>
                  <th className="border-0">Sensors</th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('todaySubmissions')}
                  >
                    Today {getSortIcon('todaySubmissions')}
                  </th>
                  <th className="border-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentBooths.map((booth) => (
                  <tr key={booth.id}>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                             style={{width: '40px', height: '40px'}}>
                          <FaMapMarkerAlt className="text-white" />
                        </div>
                        <div>
                          <div className="fw-medium">{booth.name}</div>
                          <small className="text-muted">{booth.location}</small>
                        </div>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <Badge bg={getStatusColor(booth.status)} className="d-flex align-items-center w-fit">
                        {getStatusIcon(booth.status)}
                        <span className="ms-1 text-capitalize">{booth.status}</span>
                      </Badge>
                    </td>
                    <td className="border-0 py-3">
                      <div>
                        <div className="d-flex justify-content-between mb-1">
                          <small>{booth.currentLoad}/{booth.capacity}kg</small>
                          <small>{((booth.currentLoad / booth.capacity) * 100).toFixed(0)}%</small>
                        </div>
                        <ProgressBar 
                          now={(booth.currentLoad / booth.capacity) * 100}
                          variant={getCapacityColor(booth.currentLoad, booth.capacity)}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div>
                        <div className="fw-medium">{booth.operatorName}</div>
                        <small className="text-muted">{booth.operatorPhone}</small>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        {booth.connectivity === 'online' ? (
                          <FaWifi className="text-success me-2" />
                        ) : (
                          <FaSignal className="text-danger me-2" />
                        )}
                        <div>
                          <div className="fw-medium text-capitalize">{booth.connectivity}</div>
                          <div className="d-flex align-items-center">
                            {getBatteryIcon(booth.batteryLevel)}
                            <small className="ms-1">{booth.batteryLevel}%</small>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex gap-1">
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Weight Sensor: {booth.sensors.weight}</Tooltip>}
                        >
                          <Badge bg={getSensorStatusColor(booth.sensors.weight)}>W</Badge>
                        </OverlayTrigger>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Camera: {booth.sensors.camera}</Tooltip>}
                        >
                          <Badge bg={getSensorStatusColor(booth.sensors.camera)}>C</Badge>
                        </OverlayTrigger>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>RFID: {booth.sensors.rfid}</Tooltip>}
                        >
                          <Badge bg={getSensorStatusColor(booth.sensors.rfid)}>R</Badge>
                        </OverlayTrigger>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="text-center">
                        <div className="fw-bold text-primary">{booth.todaySubmissions}</div>
                        <small className="text-muted">submissions</small>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleViewBooth(booth)}>
                            <FaEye className="me-2" />
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleEditBooth(booth)}>
                            <FaEdit className="me-2" />
                            Edit Booth
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleShowQR(booth)}>
                            <FaQrcode className="me-2" />
                            Show QR Code
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleStatusChange(booth.id, 'maintenance')}>
                            <FaToolbox className="me-2 text-warning" />
                            Mark Maintenance
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusChange(booth.id, 'active')}>
                            <FaCheckCircle className="me-2 text-success" />
                            Mark Active
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleDeleteBooth(booth)} className="text-danger">
                            <FaTrash className="me-2" />
                            Delete Booth
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
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

      {/* Add/Edit Booth Modal */}
      <Modal show={showAddModal || showEditModal} onHide={() => {
        setShowAddModal(false);
        setShowEditModal(false);
      }} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {showAddModal ? 'Add New Booth' : 'Edit Booth'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Booth Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Full Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                  />
                </Form.Group>
                
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Latitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        value={formData.coordinates.lat}
                        onChange={(e) => setFormData(prev => ({
                          ...prev, 
                          coordinates: {...prev.coordinates, lat: e.target.value}
                        }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Longitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        value={formData.coordinates.lng}
                        onChange={(e) => setFormData(prev => ({
                          ...prev, 
                          coordinates: {...prev.coordinates, lng: e.target.value}
                        }))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Capacity (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({...prev, capacity: parseInt(e.target.value) || 0}))}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Region</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData(prev => ({...prev, region: e.target.value}))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Operator Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.operatorName}
                    onChange={(e) => setFormData(prev => ({...prev, operatorName: e.target.value}))}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Operator Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.operatorPhone}
                    onChange={(e) => setFormData(prev => ({...prev, operatorPhone: e.target.value}))}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Operator Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.operatorEmail}
                    onChange={(e) => setFormData(prev => ({...prev, operatorEmail: e.target.value}))}
                  />
                </Form.Group>
                
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Opening Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={formData.operatingHours.start}
                        onChange={(e) => setFormData(prev => ({
                          ...prev, 
                          operatingHours: {...prev.operatingHours, start: e.target.value}
                        }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Closing Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={formData.operatingHours.end}
                        onChange={(e) => setFormData(prev => ({
                          ...prev, 
                          operatingHours: {...prev.operatingHours, end: e.target.value}
                        }))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({...prev, status: e.target.value}))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Accepted Waste Types</Form.Label>
                  <div className="border rounded p-3">
                    {wasteTypeOptions.map((type) => (
                      <Form.Check
                        key={type.value}
                        type="checkbox"
                        id={`waste-${type.value}`}
                        label={`${type.icon} ${type.label}`}
                        checked={formData.wasteTypes.includes(type.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev, 
                              wasteTypes: [...prev.wasteTypes, type.value]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev, 
                              wasteTypes: prev.wasteTypes.filter(t => t !== type.value)
                            }));
                          }
                        }}
                        className="mb-2"
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {showAddModal ? 'Add Booth' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Booth Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Booth Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooth && (
            <Row>
              <Col md={6}>
                {/* Basic Info */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-primary text-white">
                    <FaMapMarkerAlt className="me-2" />
                    Booth Information
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <h5>{selectedBooth.name}</h5>
                      <div className="text-muted">{selectedBooth.location}</div>
                      <div className="text-muted small">{selectedBooth.address}</div>
                    </div>
                    
                    <Row>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Status</small>
                          <div>
                            <Badge bg={getStatusColor(selectedBooth.status)} className="text-capitalize">
                              {selectedBooth.status}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Region</small>
                          <div className="fw-medium">{selectedBooth.region}</div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Capacity</small>
                          <div className="fw-medium">{selectedBooth.capacity}kg</div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Operating Hours</small>
                          <div className="fw-medium">
                            {selectedBooth.operatingHours.start} - {selectedBooth.operatingHours.end}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Operator Info */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-info text-white">
                    <FaUser className="me-2" />
                    Operator Information
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{width: '50px', height: '50px'}}>
                        <span className="text-white fw-bold h5 mb-0">
                          {selectedBooth.operatorName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="fw-bold">{selectedBooth.operatorName}</div>
                        <div className="text-muted d-flex align-items-center">
                          <FaPhone className="me-1" />
                          {selectedBooth.operatorPhone}
                        </div>
                        <div className="text-muted d-flex align-items-center">
                          <FaEnvelope className="me-1" />
                          {selectedBooth.operatorEmail}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                {/* System Status */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-success text-white">
                    <FaShieldAlt className="me-2" />
                    System Status
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col sm={6}>
                        <div className="mb-3">
                          <small className="text-muted">Connectivity</small>
                          <div className="d-flex align-items-center">
                            {selectedBooth.connectivity === 'online' ? (
                              <FaWifi className="text-success me-2" />
                            ) : (
                              <FaSignal className="text-danger me-2" />
                            )}
                            <span className="fw-medium text-capitalize">{selectedBooth.connectivity}</span>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-3">
                          <small className="text-muted">Battery Level</small>
                          <div className="d-flex align-items-center">
                            {getBatteryIcon(selectedBooth.batteryLevel)}
                            <span className="fw-medium ms-2">{selectedBooth.batteryLevel}%</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    <div className="mb-3">
                      <small className="text-muted">Sensors Status</small>
                      <div className="d-flex gap-3 mt-1">
                        <div>
                          <Badge bg={getSensorStatusColor(selectedBooth.sensors.weight)} className="me-1">
                            Weight
                          </Badge>
                          <small className="text-muted">{selectedBooth.sensors.weight}</small>
                        </div>
                        <div>
                          <Badge bg={getSensorStatusColor(selectedBooth.sensors.camera)} className="me-1">
                            Camera
                          </Badge>
                          <small className="text-muted">{selectedBooth.sensors.camera}</small>
                        </div>
                        <div>
                          <Badge bg={getSensorStatusColor(selectedBooth.sensors.rfid)} className="me-1">
                            RFID
                          </Badge>
                          <small className="text-muted">{selectedBooth.sensors.rfid}</small>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <small className="text-muted">Current Load</small>
                      <div className="d-flex justify-content-between mb-1">
                        <span>{selectedBooth.currentLoad}kg / {selectedBooth.capacity}kg</span>
                        <span>{((selectedBooth.currentLoad / selectedBooth.capacity) * 100).toFixed(0)}%</span>
                      </div>
                      <ProgressBar 
                        now={(selectedBooth.currentLoad / selectedBooth.capacity) * 100}
                        variant={getCapacityColor(selectedBooth.currentLoad, selectedBooth.capacity)}
                      />
                    </div>
                  </Card.Body>
                </Card>

                {/* Statistics */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-warning text-dark">
                    <FaChartLine className="me-2" />
                    Statistics
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col sm={6}>
                        <div className="text-center">
                          <div className="h4 text-primary mb-0">{selectedBooth.todaySubmissions}</div>
                          <small className="text-muted">Today's Submissions</small>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="text-center">
                          <div className="h4 text-success mb-0">{selectedBooth.totalSubmissions}</div>
                          <small className="text-muted">Total Submissions</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Maintenance */}
                <Card className="border-0 bg-light">
                  <Card.Header className="bg-secondary text-white">
                    <FaToolbox className="me-2" />
                    Maintenance
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <small className="text-muted">Last Maintenance</small>
                      <div className="fw-medium">
                        {new Date(selectedBooth.lastMaintenance).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <small className="text-muted">Next Scheduled</small>
                      <div className="fw-medium">
                        {new Date(selectedBooth.nextMaintenance).toLocaleDateString()}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => {
            setShowDetailsModal(false);
            if (selectedBooth) handleEditBooth(selectedBooth);
          }}>
            <FaEdit className="me-1" />
            Edit Booth
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooth && (
            <div className="text-center">
              <h5>{selectedBooth.name}</h5>
              <div className="bg-light p-4 rounded mb-3">
                {/* QR Code placeholder - replace with actual QR code generator */}
                <div className="bg-white border border-dark d-flex align-items-center justify-content-center mx-auto"
                     style={{width: '200px', height: '200px'}}>
                  <FaQrcode size={80} className="text-dark" />
                </div>
              </div>
              <div className="border rounded p-2 bg-light">
                <code>{selectedBooth.qrCode}</code>
              </div>
              <div className="mt-3">
                <Button variant="outline-primary" size="sm">
                  <FaDownload className="me-1" />
                  Download QR Code
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooth && (
            <Alert variant="warning">
              <strong>Warning!</strong> Are you sure you want to delete booth <strong>{selectedBooth.name}</strong>? 
              This action cannot be undone and will permanently remove all booth data.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <FaTrash className="me-1" />
            Delete Booth
          </Button>
        </Modal.Footer>
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
      `}</style>
    </div>
  );
};

export default BoothManagement;
