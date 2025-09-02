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
  ButtonGroup,
  ProgressBar
} from 'react-bootstrap';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaGift,
  FaCoins,
  FaShoppingCart,
  FaUsers,
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaImage,
  FaUpload,
  FaStore,
  FaCalendar,
  FaBarcode,
  FaPercent,
  FaBox,
  FaHistory,
  FaTags,
  FaChartLine,
  FaFileAlt
} from 'react-icons/fa';

const RewardsManagement = () => {
  const [rewards, setRewards] = useState([]);
  const [filteredRewards, setFilteredRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rewardsPerPage] = useState(10);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'eco_products',
    creditsRequired: 100,
    discountPercentage: 0,
    originalPrice: 0,
    stock: 100,
    maxRedemptions: 0, // 0 = unlimited
    image: '',
    sponsor: '',
    validFrom: '',
    validUntil: '',
    status: 'active',
    isPhysical: true,
    deliveryInfo: '',
    termsAndConditions: ''
  });

  // Mock data - replace with API calls
  const mockRewards = [
    {
      id: 1,
      name: 'Eco-Friendly Water Bottle',
      description: 'Stainless steel water bottle made from recycled materials',
      category: 'eco_products',
      creditsRequired: 150,
      discountPercentage: 0,
      originalPrice: 299,
      currentPrice: 0, // Free with credits
      stock: 45,
      maxRedemptions: 0,
      image: 'https://via.placeholder.com/300x200?text=Water+Bottle',
      sponsor: 'EcoLife Solutions',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      status: 'active',
      isPhysical: true,
      deliveryInfo: 'Free home delivery within 7-10 days',
      termsAndConditions: 'Valid for one redemption per user per month',
      totalRedemptions: 156,
      createdAt: '2024-01-01',
      lastRedeemed: '2024-01-21'
    },
    {
      id: 2,
      name: '₹50 Shopping Voucher',
      description: 'Digital voucher for online shopping at partner stores',
      category: 'vouchers',
      creditsRequired: 500,
      discountPercentage: 0,
      originalPrice: 50,
      currentPrice: 0,
      stock: 1000,
      maxRedemptions: 5, // Max 5 per user
      image: 'https://via.placeholder.com/300x200?text=Voucher',
      sponsor: 'ShopKart',
      validFrom: '2024-01-01',
      validUntil: '2024-03-31',
      status: 'active',
      isPhysical: false,
      deliveryInfo: 'Digital voucher sent via email instantly',
      termsAndConditions: 'Cannot be combined with other offers',
      totalRedemptions: 89,
      createdAt: '2023-12-15',
      lastRedeemed: '2024-01-21'
    },
    {
      id: 3,
      name: 'Plant Sapling Kit',
      description: 'Kit includes 5 native plant saplings with planting guide',
      category: 'plants',
      creditsRequired: 200,
      discountPercentage: 20,
      originalPrice: 150,
      currentPrice: 120,
      stock: 0, // Out of stock
      maxRedemptions: 0,
      image: 'https://via.placeholder.com/300x200?text=Plant+Kit',
      sponsor: 'Green Earth Foundation',
      validFrom: '2024-01-01',
      validUntil: '2024-06-30',
      status: 'out_of_stock',
      isPhysical: true,
      deliveryInfo: 'Delivered fresh, may take 3-5 days',
      termsAndConditions: 'Best planted during monsoon season',
      totalRedemptions: 234,
      createdAt: '2023-11-01',
      lastRedeemed: '2024-01-20'
    },
    {
      id: 4,
      name: 'Organic Food Discount',
      description: '30% discount on organic food products',
      category: 'discounts',
      creditsRequired: 100,
      discountPercentage: 30,
      originalPrice: 0,
      currentPrice: 0,
      stock: 500,
      maxRedemptions: 3,
      image: 'https://via.placeholder.com/300x200?text=Organic+Food',
      sponsor: 'OrganicMart',
      validFrom: '2024-01-01',
      validUntil: '2024-02-29',
      status: 'active',
      isPhysical: false,
      deliveryInfo: 'Use coupon code at checkout',
      termsAndConditions: 'Valid on minimum purchase of ₹500',
      totalRedemptions: 67,
      createdAt: '2024-01-10',
      lastRedeemed: '2024-01-21'
    },
    {
      id: 5,
      name: 'Bamboo Cutlery Set',
      description: 'Reusable bamboo cutlery set with carrying case',
      category: 'eco_products',
      creditsRequired: 300,
      discountPercentage: 0,
      originalPrice: 450,
      currentPrice: 0,
      stock: 25,
      maxRedemptions: 0,
      image: 'https://via.placeholder.com/300x200?text=Bamboo+Cutlery',
      sponsor: 'EcoUtensils Co.',
      validFrom: '2024-01-15',
      validUntil: '2024-12-31',
      status: 'inactive',
      isPhysical: true,
      deliveryInfo: 'Standard delivery 5-7 business days',
      termsAndConditions: 'Limited edition item',
      totalRedemptions: 12,
      createdAt: '2024-01-15',
      lastRedeemed: '2024-01-19'
    }
  ];

  const categories = [
    { value: 'eco_products', label: 'Eco Products', icon: '🌱' },
    { value: 'vouchers', label: 'Vouchers', icon: '🎫' },
    { value: 'discounts', label: 'Discounts', icon: '💰' },
    { value: 'plants', label: 'Plants & Seeds', icon: '🌿' },
    { value: 'experiences', label: 'Experiences', icon: '🎯' },
    { value: 'books', label: 'Books & Learning', icon: '📚' }
  ];

  useEffect(() => {
    // Simulate API call
    const loadRewards = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRewards(mockRewards);
      setFilteredRewards(mockRewards);
      setIsLoading(false);
    };

    loadRewards();
  }, []);

  // Filter and search rewards
  useEffect(() => {
    let filtered = rewards.filter(reward => {
      const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reward.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reward.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || reward.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || reward.status === filterStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort rewards
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'createdAt' || sortField === 'lastRedeemed') {
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

    setFilteredRewards(filtered);
    setCurrentPage(1);
  }, [rewards, searchTerm, filterCategory, filterStatus, sortField, sortOrder]);

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
      case 'out_of_stock': return 'danger';
      case 'expired': return 'warning';
      default: return 'dark';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaCheckCircle />;
      case 'inactive': return <FaTimes />;
      case 'out_of_stock': return <FaExclamationTriangle />;
      case 'expired': return <FaCalendar />;
      default: return <FaCheckCircle />;
    }
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : '🎁';
  };

  const handleAddReward = () => {
    setFormData({
      name: '',
      description: '',
      category: 'eco_products',
      creditsRequired: 100,
      discountPercentage: 0,
      originalPrice: 0,
      stock: 100,
      maxRedemptions: 0,
      image: '',
      sponsor: '',
      validFrom: '',
      validUntil: '',
      status: 'active',
      isPhysical: true,
      deliveryInfo: '',
      termsAndConditions: ''
    });
    setShowAddModal(true);
  };

  const handleEditReward = (reward) => {
    setSelectedReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      category: reward.category,
      creditsRequired: reward.creditsRequired,
      discountPercentage: reward.discountPercentage,
      originalPrice: reward.originalPrice,
      stock: reward.stock,
      maxRedemptions: reward.maxRedemptions,
      image: reward.image,
      sponsor: reward.sponsor,
      validFrom: reward.validFrom,
      validUntil: reward.validUntil,
      status: reward.status,
      isPhysical: reward.isPhysical,
      deliveryInfo: reward.deliveryInfo,
      termsAndConditions: reward.termsAndConditions
    });
    setShowEditModal(true);
  };

  const handleDeleteReward = (reward) => {
    setSelectedReward(reward);
    setShowDeleteModal(true);
  };

  const handleViewReward = (reward) => {
    setSelectedReward(reward);
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
    console.log('Deleting reward:', selectedReward.id);
    setShowDeleteModal(false);
  };

  const handleStatusChange = async (rewardId, newStatus) => {
    // Add status update API call here
    console.log('Changing status:', rewardId, newStatus);
  };

  // Pagination
  const indexOfLastReward = currentPage * rewardsPerPage;
  const indexOfFirstReward = indexOfLastReward - rewardsPerPage;
  const currentRewards = filteredRewards.slice(indexOfFirstReward, indexOfLastReward);
  const totalPages = Math.ceil(filteredRewards.length / rewardsPerPage);

  // Statistics
  const stats = {
    total: rewards.length,
    active: rewards.filter(r => r.status === 'active').length,
    outOfStock: rewards.filter(r => r.status === 'out_of_stock').length,
    totalRedemptions: rewards.reduce((sum, r) => sum + r.totalRedemptions, 0),
    totalCreditsRedeemed: rewards.reduce((sum, r) => sum + (r.totalRedemptions * r.creditsRequired), 0),
    avgCreditsPerReward: rewards.reduce((sum, r) => sum + r.creditsRequired, 0) / rewards.length
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Rewards Management</h2>
          <p className="text-muted mb-0">Manage reward catalog and redemptions</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm">
            <FaDownload className="me-1" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddReward}>
            <FaPlus className="me-1" />
            Add Reward
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-primary mb-1">{stats.total}</div>
              <small className="text-muted">Total Rewards</small>
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
              <div className="h4 text-danger mb-1">{stats.outOfStock}</div>
              <small className="text-muted">Out of Stock</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-warning mb-1">{stats.totalRedemptions}</div>
              <small className="text-muted">Total Redemptions</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-info mb-1">{stats.totalCreditsRedeemed.toLocaleString()}</div>
              <small className="text-muted">Credits Redeemed</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h4 text-secondary mb-1">{Math.round(stats.avgCreditsPerReward)}</div>
              <small className="text-muted">Avg Credits</small>
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
                  placeholder="Search rewards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="expired">Expired</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted">
                Showing {indexOfFirstReward + 1}-{Math.min(indexOfLastReward, filteredRewards.length)} of {filteredRewards.length} rewards
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Rewards Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Loading rewards...</div>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Reward {getSortIcon('name')}
                  </th>
                  <th className="border-0">Category</th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('creditsRequired')}
                  >
                    Credits {getSortIcon('creditsRequired')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('stock')}
                  >
                    Stock {getSortIcon('stock')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th 
                    className="border-0 cursor-pointer"
                    onClick={() => handleSort('totalRedemptions')}
                  >
                    Redemptions {getSortIcon('totalRedemptions')}
                  </th>
                  <th className="border-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRewards.map((reward) => (
                  <tr key={reward.id}>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <Image
                          src={reward.image}
                          alt={reward.name}
                          width={50}
                          height={50}
                          rounded
                          className="me-3"
                          style={{objectFit: 'cover'}}
                        />
                        <div>
                          <div className="fw-medium">{reward.name}</div>
                          <small className="text-muted">{reward.sponsor}</small>
                        </div>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <span className="me-2">{getCategoryIcon(reward.category)}</span>
                        <span className="text-capitalize">
                          {categories.find(c => c.value === reward.category)?.label || reward.category}
                        </span>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <FaCoins className="text-warning me-1" />
                        <span className="fw-medium">{reward.creditsRequired}</span>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div>
                        <div className="fw-medium">{reward.stock}</div>
                        {reward.stock <= 10 && reward.stock > 0 && (
                          <small className="text-warning">Low stock</small>
                        )}
                        {reward.stock === 0 && (
                          <small className="text-danger">Out of stock</small>
                        )}
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <Badge bg={getStatusColor(reward.status)} className="d-flex align-items-center w-fit">
                        {getStatusIcon(reward.status)}
                        <span className="ms-1 text-capitalize">{reward.status.replace('_', ' ')}</span>
                      </Badge>
                    </td>
                    <td className="border-0 py-3">
                      <div className="text-center">
                        <div className="fw-bold text-primary">{reward.totalRedemptions}</div>
                        <small className="text-muted">
                          {(reward.totalRedemptions * reward.creditsRequired).toLocaleString()} credits
                        </small>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleViewReward(reward)}>
                            <FaEye className="me-2" />
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleEditReward(reward)}>
                            <FaEdit className="me-2" />
                            Edit Reward
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleStatusChange(reward.id, 'active')}>
                            <FaCheckCircle className="me-2 text-success" />
                            Activate
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusChange(reward.id, 'inactive')}>
                            <FaTimes className="me-2 text-warning" />
                            Deactivate
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleDeleteReward(reward)} className="text-danger">
                            <FaTrash className="me-2" />
                            Delete Reward
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

      {/* Add/Edit Reward Modal */}
      <Modal show={showAddModal || showEditModal} onHide={() => {
        setShowAddModal(false);
        setShowEditModal(false);
      }} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {showAddModal ? 'Add New Reward' : 'Edit Reward'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reward Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    required
                  />
                </Form.Group>
                
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                        required
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({...prev, status: e.target.value}))}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Credits Required *</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={formData.creditsRequired}
                        onChange={(e) => setFormData(prev => ({...prev, creditsRequired: parseInt(e.target.value) || 0}))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stock Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({...prev, stock: parseInt(e.target.value) || 0}))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Original Price (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData(prev => ({...prev, originalPrice: parseFloat(e.target.value) || 0}))}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Discount % (if any)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discountPercentage}
                        onChange={(e) => setFormData(prev => ({...prev, discountPercentage: parseInt(e.target.value) || 0}))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Sponsor/Partner</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.sponsor}
                    onChange={(e) => setFormData(prev => ({...prev, sponsor: e.target.value}))}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Image URL</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({...prev, image: e.target.value}))}
                      placeholder="https://example.com/image.jpg"
                    />
                    <Button variant="outline-secondary">
                      <FaUpload />
                    </Button>
                  </InputGroup>
                  {formData.image && (
                    <div className="mt-2">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        width={100}
                        height={100}
                        rounded
                        style={{objectFit: 'cover'}}
                      />
                    </div>
                  )}
                </Form.Group>
                
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Valid From</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData(prev => ({...prev, validFrom: e.target.value}))}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Valid Until</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData(prev => ({...prev, validUntil: e.target.value}))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Max Redemptions per User</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.maxRedemptions}
                    onChange={(e) => setFormData(prev => ({...prev, maxRedemptions: parseInt(e.target.value) || 0}))}
                    placeholder="0 for unlimited"
                  />
                  <Form.Text className="text-muted">0 means unlimited redemptions</Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Physical Product (requires delivery)"
                    checked={formData.isPhysical}
                    onChange={(e) => setFormData(prev => ({...prev, isPhysical: e.target.checked}))}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Information</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.deliveryInfo}
                    onChange={(e) => setFormData(prev => ({...prev, deliveryInfo: e.target.value}))}
                    placeholder="e.g., Free delivery within 7 days"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Terms & Conditions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData(prev => ({...prev, termsAndConditions: e.target.value}))}
                    placeholder="Terms and conditions for this reward"
                  />
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
              {showAddModal ? 'Add Reward' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reward Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Reward Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReward && (
            <Row>
              <Col md={6}>
                <div className="text-center mb-4">
                  <Image
                    src={selectedReward.image}
                    alt={selectedReward.name}
                    fluid
                    rounded
                    style={{maxHeight: '200px', objectFit: 'cover'}}
                  />
                </div>
                
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5>{selectedReward.name}</h5>
                    <p className="text-muted">{selectedReward.description}</p>
                    
                    <Row>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Category</small>
                          <div className="d-flex align-items-center">
                            <span className="me-2">{getCategoryIcon(selectedReward.category)}</span>
                            <span>{categories.find(c => c.value === selectedReward.category)?.label}</span>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Status</small>
                          <div>
                            <Badge bg={getStatusColor(selectedReward.status)} className="text-capitalize">
                              {selectedReward.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Credits Required</small>
                          <div className="fw-medium text-warning">
                            <FaCoins className="me-1" />
                            {selectedReward.creditsRequired}
                          </div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-2">
                          <small className="text-muted">Stock</small>
                          <div className="fw-medium">{selectedReward.stock}</div>
                        </div>
                      </Col>
                    </Row>
                    
                    {selectedReward.sponsor && (
                      <div className="mt-3">
                        <small className="text-muted">Sponsored by</small>
                        <div className="fw-medium">{selectedReward.sponsor}</div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-primary text-white">
                    <FaChartLine className="me-2" />
                    Statistics
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col sm={6}>
                        <div className="text-center">
                          <div className="h4 text-primary mb-0">{selectedReward.totalRedemptions}</div>
                          <small className="text-muted">Total Redemptions</small>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="text-center">
                          <div className="h4 text-success mb-0">
                            {(selectedReward.totalRedemptions * selectedReward.creditsRequired).toLocaleString()}
                          </div>
                          <small className="text-muted">Credits Redeemed</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="mb-3 border-0 bg-light">
                  <Card.Header className="bg-info text-white">
                    <FaCalendar className="me-2" />
                    Validity & Limits
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <small className="text-muted">Valid From</small>
                      <div>{new Date(selectedReward.validFrom).toLocaleDateString()}</div>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Valid Until</small>
                      <div>{new Date(selectedReward.validUntil).toLocaleDateString()}</div>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Max Redemptions per User</small>
                      <div>{selectedReward.maxRedemptions || 'Unlimited'}</div>
                    </div>
                    <div>
                      <small className="text-muted">Type</small>
                      <div>
                        <Badge bg={selectedReward.isPhysical ? 'warning' : 'info'}>
                          {selectedReward.isPhysical ? 'Physical Product' : 'Digital/Service'}
                        </Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {selectedReward.deliveryInfo && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Header className="bg-warning text-dark">
                      <FaBox className="me-2" />
                      Delivery Information
                    </Card.Header>
                    <Card.Body>
                      <p className="mb-0">{selectedReward.deliveryInfo}</p>
                    </Card.Body>
                  </Card>
                )}

                {selectedReward.termsAndConditions && (
                  <Card className="border-0 bg-light">
                    <Card.Header className="bg-secondary text-white">
                      <FaFileAlt className="me-2" />
                      Terms & Conditions
                    </Card.Header>
                    <Card.Body>
                      <p className="mb-0 small">{selectedReward.termsAndConditions}</p>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => {
            setShowDetailsModal(false);
            if (selectedReward) handleEditReward(selectedReward);
          }}>
            <FaEdit className="me-1" />
            Edit Reward
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
          {selectedReward && (
            <Alert variant="warning">
              <strong>Warning!</strong> Are you sure you want to delete reward <strong>{selectedReward.name}</strong>? 
              This action cannot be undone and will affect users who may have this reward in their wishlist.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <FaTrash className="me-1" />
            Delete Reward
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

export default RewardsManagement;
