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
  FaFilter,
  FaCoins,
  FaUserShield,
  FaUserTimes,
  FaCheckCircle,
  FaTimes,
  FaHistory,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendar,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaRecycle,
  FaChartLine
} from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRank, setFilterRank] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    rank: 'Bronze',
    greenCredits: 0
  });

  // Mock data - replace with API calls
  const mockUsers = [
    {
      id: 1,
      fullName: 'Rajesh Sharma',
      email: 'rajesh.sharma@email.com',
      phone: '+91 9876543210',
      address: 'Mumbai, Maharashtra',
      status: 'active',
      rank: 'Silver',
      greenCredits: 1250,
      totalSubmissions: 45,
      totalWaste: 87.5,
      createdAt: '2024-01-15',
      lastActive: '2024-01-20',
      profileImage: null
    },
    {
      id: 2,
      fullName: 'Priya Patel',
      email: 'priya.patel@email.com',
      phone: '+91 9876543211',
      address: 'Ahmedabad, Gujarat',
      status: 'active',
      rank: 'Gold',
      greenCredits: 3420,
      totalSubmissions: 89,
      totalWaste: 156.2,
      createdAt: '2024-01-10',
      lastActive: '2024-01-21',
      profileImage: null
    },
    {
      id: 3,
      fullName: 'Amit Kumar',
      email: 'amit.kumar@email.com',
      phone: '+91 9876543212',
      address: 'Delhi, Delhi',
      status: 'inactive',
      rank: 'Bronze',
      greenCredits: 450,
      totalSubmissions: 12,
      totalWaste: 23.1,
      createdAt: '2024-01-20',
      lastActive: '2024-01-18',
      profileImage: null
    },
    {
      id: 4,
      fullName: 'Sneha Reddy',
      email: 'sneha.reddy@email.com',
      phone: '+91 9876543213',
      address: 'Hyderabad, Telangana',
      status: 'active',
      rank: 'Platinum',
      greenCredits: 6750,
      totalSubmissions: 134,
      totalWaste: 289.7,
      createdAt: '2024-01-05',
      lastActive: '2024-01-21',
      profileImage: null
    },
    {
      id: 5,
      fullName: 'Arjun Singh',
      email: 'arjun.singh@email.com',
      phone: '+91 9876543214',
      address: 'Jaipur, Rajasthan',
      status: 'suspended',
      rank: 'Silver',
      greenCredits: 1890,
      totalSubmissions: 67,
      totalWaste: 134.8,
      createdAt: '2024-01-12',
      lastActive: '2024-01-19',
      profileImage: null
    }
  ];

  useEffect(() => {
    // Simulate API call
    const loadUsers = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setIsLoading(false);
    };

    loadUsers();
  }, []);

  // Filter and search users
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.phone.includes(searchTerm);
      
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      const matchesRank = filterRank === 'all' || user.rank === filterRank;
      
      return matchesSearch && matchesStatus && matchesRank;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'createdAt' || sortField === 'lastActive') {
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

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, filterStatus, filterRank, sortField, sortOrder]);

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

  const getRankColor = (rank) => {
    switch (rank) {
      case 'Bronze': return 'warning';
      case 'Silver': return 'secondary';
      case 'Gold': return 'success';
      case 'Platinum': return 'info';
      case 'Diamond': return 'primary';
      default: return 'dark';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'suspended': return 'danger';
      default: return 'dark';
    }
  };

  const handleAddUser = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      rank: 'Bronze',
      greenCredits: 0
    });
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      status: user.status,
      rank: user.rank,
      greenCredits: user.greenCredits
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
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
    console.log('Deleting user:', selectedUser.id);
    setShowDeleteModal(false);
  };

  const handleStatusChange = async (userId, newStatus) => {
    // Add status update API call here
    console.log('Changing status:', userId, newStatus);
  };

  const handleCreditsAdjustment = async (userId, adjustment) => {
    // Add credits adjustment API call here
    console.log('Adjusting credits:', userId, adjustment);
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">User Management</h2>
          <p className="text-muted mb-0">Manage user accounts and activities</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm">
            <FaDownload className="me-1" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddUser}>
            <FaPlus className="me-1" />
            Add User
          </Button>
        </div>
      </div>

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
                  placeholder="Search users..."
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
                <option value="suspended">Suspended</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterRank}
                onChange={(e) => setFilterRank(e.target.value)}
              >
                <option value="all">All Ranks</option>
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
                <option value="Diamond">Diamond</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted">
                Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Loading users...</div>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('fullName')}
                  >
                    User {getSortIcon('fullName')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('rank')}
                  >
                    Rank {getSortIcon('rank')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('greenCredits')}
                  >
                    Credits {getSortIcon('greenCredits')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('totalSubmissions')}
                  >
                    Submissions {getSortIcon('totalSubmissions')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Joined {getSortIcon('createdAt')}
                  </th>
                  <th className="border-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                             style={{width: '40px', height: '40px'}}>
                          <span className="text-white fw-bold">
                            {user.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="fw-medium">{user.fullName}</div>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <Badge bg={getStatusColor(user.status)} className="text-capitalize">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="border-0 py-3">
                      <Badge bg={getRankColor(user.rank)}>
                        {user.rank}
                      </Badge>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <FaCoins className="text-warning me-1" />
                        {user.greenCredits.toLocaleString()}
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <span className="fw-medium">{user.totalSubmissions}</span>
                      <small className="text-muted d-block">{user.totalWaste}kg</small>
                    </td>
                    <td className="border-0 py-3">
                      <div>
                        <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                        <small className="text-muted">
                          Last: {new Date(user.lastActive).toLocaleDateString()}
                        </small>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleViewUser(user)}>
                            <FaEye className="me-2" />
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleEditUser(user)}>
                            <FaEdit className="me-2" />
                            Edit User
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleStatusChange(user.id, 'active')}>
                            <FaCheckCircle className="me-2 text-success" />
                            Activate
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusChange(user.id, 'suspended')}>
                            <FaUserTimes className="me-2 text-warning" />
                            Suspend
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleDeleteUser(user)} className="text-danger">
                            <FaTrash className="me-2" />
                            Delete User
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

      {/* Add/Edit User Modal */}
      <Modal show={showAddModal || showEditModal} onHide={() => {
        setShowAddModal(false);
        setShowEditModal(false);
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {showAddModal ? 'Add New User' : 'Edit User'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({...prev, status: e.target.value}))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rank</Form.Label>
                  <Form.Select
                    value={formData.rank}
                    onChange={(e) => setFormData(prev => ({...prev, rank: e.target.value}))}
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Green Credits</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.greenCredits}
                    onChange={(e) => setFormData(prev => ({...prev, greenCredits: parseInt(e.target.value) || 0}))}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {showAddModal ? 'Add User' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Row>
              <Col md={4}>
                <div className="text-center mb-4">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                       style={{width: '80px', height: '80px'}}>
                    <span className="text-white fw-bold h3 mb-0">
                      {selectedUser.fullName.charAt(0)}
                    </span>
                  </div>
                  <h5>{selectedUser.fullName}</h5>
                  <Badge bg={getStatusColor(selectedUser.status)} className="text-capitalize mb-2">
                    {selectedUser.status}
                  </Badge>
                  <br />
                  <Badge bg={getRankColor(selectedUser.rank)}>
                    {selectedUser.rank}
                  </Badge>
                </div>
              </Col>
              <Col md={8}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <Row>
                      <Col sm={6} className="mb-3">
                        <div className="d-flex align-items-center">
                          <FaEnvelope className="text-muted me-2" />
                          <div>
                            <small className="text-muted d-block">Email</small>
                            <span>{selectedUser.email}</span>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6} className="mb-3">
                        <div className="d-flex align-items-center">
                          <FaPhone className="text-muted me-2" />
                          <div>
                            <small className="text-muted d-block">Phone</small>
                            <span>{selectedUser.phone}</span>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6} className="mb-3">
                        <div className="d-flex align-items-center">
                          <FaMapMarkerAlt className="text-muted me-2" />
                          <div>
                            <small className="text-muted d-block">Address</small>
                            <span>{selectedUser.address}</span>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6} className="mb-3">
                        <div className="d-flex align-items-center">
                          <FaCalendar className="text-muted me-2" />
                          <div>
                            <small className="text-muted d-block">Joined</small>
                            <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Row className="mt-4">
                  <Col sm={4}>
                    <Card className="text-center border-0 bg-primary bg-opacity-10">
                      <Card.Body>
                        <FaCoins className="text-primary mb-2" size={24} />
                        <div className="h4 mb-0">{selectedUser.greenCredits.toLocaleString()}</div>
                        <small className="text-muted">Green Credits</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col sm={4}>
                    <Card className="text-center border-0 bg-success bg-opacity-10">
                      <Card.Body>
                        <FaRecycle className="text-success mb-2" size={24} />
                        <div className="h4 mb-0">{selectedUser.totalSubmissions}</div>
                        <small className="text-muted">Submissions</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col sm={4}>
                    <Card className="text-center border-0 bg-info bg-opacity-10">
                      <Card.Body>
                        <FaChartLine className="text-info mb-2" size={24} />
                        <div className="h4 mb-0">{selectedUser.totalWaste}kg</div>
                        <small className="text-muted">Total Waste</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => {
            setShowDetailsModal(false);
            if (selectedUser) handleEditUser(selectedUser);
          }}>
            <FaEdit className="me-1" />
            Edit User
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Alert variant="warning">
              <strong>Warning!</strong> Are you sure you want to delete user <strong>{selectedUser.fullName}</strong>? 
              This action cannot be undone and will permanently remove all user data including submissions and credits.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <FaTrash className="me-1" />
            Delete User
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
      `}</style>
    </div>
  );
};

export default UserManagement;
