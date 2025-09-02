import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Modal,
  Alert,
  Spinner,
  Image,
  Form,
  InputGroup,
  Dropdown
} from 'react-bootstrap';
import {
  FaHistory,
  FaEye,
  FaDownload,
  FaSearch,
  FaFilter,
  FaShippingFast,
  FaCheck,
  FaClock,
  FaTimes,
  FaGift,
  FaCoins,
  FaCalendar,
  FaReceipt,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock data - replace with API calls
  const mockOrders = [
    {
      id: 'ORD-2024-001',
      reward: {
        id: 1,
        name: 'Eco-Friendly Water Bottle',
        image: 'https://via.placeholder.com/80x80?text=Water+Bottle',
        category: 'eco_products'
      },
      quantity: 1,
      creditsUsed: 150,
      status: 'delivered',
      orderDate: '2024-01-15T10:30:00Z',
      deliveryDate: '2024-01-22T14:20:00Z',
      deliveryAddress: {
        fullName: 'John Doe',
        street: '123 Green Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        phone: '+91 9876543210'
      },
      trackingNumber: 'TRK123456789',
      sponsor: 'EcoLife Solutions',
      notes: 'Package delivered successfully'
    },
    {
      id: 'ORD-2024-002',
      reward: {
        id: 2,
        name: '₹100 Green Shopping Voucher',
        image: 'https://via.placeholder.com/80x80?text=Voucher',
        category: 'vouchers'
      },
      quantity: 1,
      creditsUsed: 500,
      status: 'redeemed',
      orderDate: '2024-01-20T09:15:00Z',
      redemptionDate: '2024-01-20T09:16:00Z',
      voucherCode: 'GREEN100-ABC123',
      sponsor: 'GreenMart Network',
      notes: 'Digital voucher sent instantly'
    },
    {
      id: 'ORD-2024-003',
      reward: {
        id: 3,
        name: 'Solar Power Bank',
        image: 'https://via.placeholder.com/80x80?text=Solar+Bank',
        category: 'electronics'
      },
      quantity: 1,
      creditsUsed: 800,
      status: 'processing',
      orderDate: '2024-01-25T16:45:00Z',
      estimatedDelivery: '2024-02-02T00:00:00Z',
      sponsor: 'SolarTech India',
      notes: 'Order is being prepared for shipment'
    },
    {
      id: 'ORD-2024-004',
      reward: {
        id: 4,
        name: 'Bamboo Cutlery Set',
        image: 'https://via.placeholder.com/80x80?text=Cutlery',
        category: 'eco_products'
      },
      quantity: 2,
      creditsUsed: 240,
      status: 'shipped',
      orderDate: '2024-01-28T11:20:00Z',
      shippedDate: '2024-01-30T08:30:00Z',
      estimatedDelivery: '2024-02-05T00:00:00Z',
      trackingNumber: 'TRK987654321',
      sponsor: 'BambooLife',
      notes: 'Package shipped via express delivery'
    }
  ];

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getUserRedemptions({
          page: 1,
          limit: 50
        });
        
        if (response.success) {
          const ordersData = response.data.redemptions || [];
          
          // Transform API data to match our format
          const transformedOrders = ordersData.map(order => ({
            id: order._id,
            reward: {
              id: order.reward._id,
              name: order.reward.name,
              image: order.reward.images?.[0]?.url || 'https://via.placeholder.com/80x80?text=Reward',
              category: order.reward.category
            },
            quantity: order.quantity,
            creditsUsed: order.pointsUsed,
            status: order.status, // 'pending', 'processing', 'shipped', 'delivered', 'redeemed', 'cancelled'
            orderDate: order.createdAt,
            deliveryDate: order.deliveryDate,
            shippedDate: order.shippedDate,
            estimatedDelivery: order.estimatedDelivery,
            deliveryAddress: order.deliveryAddress,
            trackingNumber: order.trackingNumber,
            voucherCode: order.voucherCode,
            sponsor: order.reward.sponsor?.name,
            notes: order.notes
          }));
          
          setOrders(transformedOrders);
          setFilteredOrders(transformedOrders);
        } else {
          // Fallback to mock data
          setOrders(mockOrders);
          setFilteredOrders(mockOrders);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
        toast.error('Failed to load order history');
        
        // Fallback to mock data
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Filter orders
  useEffect(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = order.reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.sponsor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const matchesDate = (() => {
        if (dateRange === 'all') return true;
        
        const orderDate = new Date(order.orderDate);
        const now = new Date();
        const daysAgo = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365
        }[dateRange];
        
        return daysAgo ? (now - orderDate) / (1000 * 60 * 60 * 24) <= daysAgo : true;
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, dateRange]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'warning', text: 'Pending', icon: FaClock },
      processing: { bg: 'info', text: 'Processing', icon: FaClock },
      shipped: { bg: 'primary', text: 'Shipped', icon: FaShippingFast },
      delivered: { bg: 'success', text: 'Delivered', icon: FaCheck },
      redeemed: { bg: 'success', text: 'Redeemed', icon: FaGift },
      cancelled: { bg: 'danger', text: 'Cancelled', icon: FaTimes }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-1">
        <IconComponent size={12} />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleDownloadReceipt = (orderId) => {
    // Implement receipt download
    toast.info('Receipt download feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading order history...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">
            <FaHistory className="text-primary me-2" />
            Order History
          </h2>
          <p className="text-muted mb-0">Track your reward redemptions and deliveries</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={() => handleDownloadReceipt('all')}>
            <FaDownload className="me-1" />
            Export All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Search Orders</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by order ID, reward name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="redeemed">Redeemed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <Form.Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateRange('all');
                }}
                className="w-100"
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Order Summary */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h3 text-primary mb-1">{orders.length}</div>
              <small className="text-muted">Total Orders</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h3 text-success mb-1">
                {orders.filter(o => ['delivered', 'redeemed'].includes(o.status)).length}
              </div>
              <small className="text-muted">Completed</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h3 text-info mb-1">
                {orders.filter(o => ['processing', 'shipped'].includes(o.status)).length}
              </div>
              <small className="text-muted">In Progress</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h3 text-warning mb-1">
                {orders.reduce((sum, order) => sum + order.creditsUsed, 0).toLocaleString()}
              </div>
              <small className="text-muted">Credits Used</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-5">
              <FaHistory size={60} className="text-muted mb-3" />
              <h5>No orders found</h5>
              <p className="text-muted">
                {searchTerm || statusFilter !== 'all' || dateRange !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'You haven\'t redeemed any rewards yet'
                }
              </p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0">Order Details</th>
                  <th className="border-0">Reward</th>
                  <th className="border-0">Credits Used</th>
                  <th className="border-0">Status</th>
                  <th className="border-0">Date</th>
                  <th className="border-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="border-0 py-3">
                      <div>
                        <div className="fw-bold">{order.id}</div>
                        <small className="text-muted">
                          Qty: {order.quantity} • {order.sponsor}
                        </small>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <Image
                          src={order.reward.image}
                          alt={order.reward.name}
                          width={40}
                          height={40}
                          rounded
                          className="me-3"
                        />
                        <div>
                          <div className="fw-medium">{order.reward.name}</div>
                          <small className="text-muted text-capitalize">
                            {order.reward.category.replace('_', ' ')}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex align-items-center">
                        <FaCoins className="text-warning me-1" />
                        <span className="fw-bold">{order.creditsUsed.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="border-0 py-3">
                      <div>
                        <div className="fw-medium">{formatDate(order.orderDate)}</div>
                        {order.deliveryDate && (
                          <small className="text-success">
                            Delivered: {formatDate(order.deliveryDate)}
                          </small>
                        )}
                        {order.estimatedDelivery && !order.deliveryDate && (
                          <small className="text-muted">
                            ETA: {new Date(order.estimatedDelivery).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="border-0 py-3">
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleDownloadReceipt(order.id)}
                        >
                          <FaDownload />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Order Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details - {selectedOrder?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              {/* Order Summary */}
              <Row className="mb-4">
                <Col md={6}>
                  <div className="d-flex align-items-center mb-3">
                    <Image
                      src={selectedOrder.reward.image}
                      alt={selectedOrder.reward.name}
                      width={60}
                      height={60}
                      rounded
                      className="me-3"
                    />
                    <div>
                      <h6 className="fw-bold mb-1">{selectedOrder.reward.name}</h6>
                      <div className="text-muted">Quantity: {selectedOrder.quantity}</div>
                      <div className="d-flex align-items-center">
                        <FaCoins className="text-warning me-1" />
                        <span className="fw-bold">{selectedOrder.creditsUsed} credits</span>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="mb-2">{getStatusBadge(selectedOrder.status)}</div>
                  <div className="text-muted">Order Date</div>
                  <div className="fw-bold">{formatDate(selectedOrder.orderDate)}</div>
                </Col>
              </Row>

              {/* Tracking Information */}
              {selectedOrder.trackingNumber && (
                <Alert variant="info" className="mb-4">
                  <div className="d-flex align-items-center">
                    <FaShippingFast className="me-2" />
                    <div>
                      <strong>Tracking Number:</strong> {selectedOrder.trackingNumber}
                      <div className="small">Package is on its way to you</div>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Voucher Code */}
              {selectedOrder.voucherCode && (
                <Alert variant="success" className="mb-4">
                  <div className="d-flex align-items-center">
                    <FaGift className="me-2" />
                    <div>
                      <strong>Voucher Code:</strong> {selectedOrder.voucherCode}
                      <div className="small">Use this code at participating stores</div>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Delivery Address */}
              {selectedOrder.deliveryAddress && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">
                    <FaMapMarkerAlt className="me-2" />
                    Delivery Address
                  </h6>
                  <div className="bg-light p-3 rounded">
                    <div className="fw-bold">{selectedOrder.deliveryAddress.fullName}</div>
                    <div>{selectedOrder.deliveryAddress.street}</div>
                    <div>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}</div>
                    <div>{selectedOrder.deliveryAddress.zipCode}</div>
                    <div className="text-muted mt-1">Phone: {selectedOrder.deliveryAddress.phone}</div>
                  </div>
                </div>
              )}

              {/* Order Timeline */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3">
                  <FaCalendar className="me-2" />
                  Order Timeline
                </h6>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker bg-success"></div>
                    <div className="timeline-content">
                      <div className="fw-bold">Order Placed</div>
                      <div className="text-muted">{formatDate(selectedOrder.orderDate)}</div>
                    </div>
                  </div>
                  
                  {selectedOrder.status !== 'pending' && (
                    <div className="timeline-item">
                      <div className="timeline-marker bg-info"></div>
                      <div className="timeline-content">
                        <div className="fw-bold">Processing</div>
                        <div className="text-muted">Order confirmed and being prepared</div>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.shippedDate && (
                    <div className="timeline-item">
                      <div className="timeline-marker bg-primary"></div>
                      <div className="timeline-content">
                        <div className="fw-bold">Shipped</div>
                        <div className="text-muted">{formatDate(selectedOrder.shippedDate)}</div>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.deliveryDate && (
                    <div className="timeline-item">
                      <div className="timeline-marker bg-success"></div>
                      <div className="timeline-content">
                        <div className="fw-bold">Delivered</div>
                        <div className="text-muted">{formatDate(selectedOrder.deliveryDate)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h6 className="fw-bold mb-2">Notes</h6>
                  <div className="text-muted">{selectedOrder.notes}</div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handleDownloadReceipt(selectedOrder?.id)}>
            <FaReceipt className="me-1" />
            Download Receipt
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 20px;
        }
        
        .timeline::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #dee2e6;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 20px;
        }
        
        .timeline-marker {
          position: absolute;
          left: -15px;
          top: 5px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid white;
        }
        
        .timeline-content {
          margin-left: 10px;
        }
      `}</style>
    </div>
  );
};

export default OrderHistoryPage;
