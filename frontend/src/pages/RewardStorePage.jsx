import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Badge,
  Modal,
  Alert,
  Spinner,
  Image,
  Pagination,
} from "react-bootstrap";
import {
  FaGift,
  FaCoins,
  FaSearch,
  FaFilter,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaEye,
  FaCheck,
  FaTimes,
  FaStore,
  FaHistory,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaShippingFast,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";
import { toast } from "react-toastify";

// Mock data - replace with API calls
const mockRewards = [
  {
    id: 1,
    name: "Eco-Friendly Water Bottle",
    description:
      "Premium stainless steel water bottle made from 100% recycled materials. Keeps drinks cold for 24 hours or hot for 12 hours.",
    category: "eco_products",
    creditsRequired: 150,
    originalPrice: 299,
    discountPercentage: 0,
    stock: 45,
    rating: 4.8,
    reviews: 124,
    image: "https://via.placeholder.com/300x200?text=Water+Bottle",
    images: [
      "https://via.placeholder.com/300x200?text=Water+Bottle+1",
      "https://via.placeholder.com/300x200?text=Water+Bottle+2",
    ],
    sponsor: "EcoLife Solutions",
    isPhysical: true,
    deliveryInfo: "Free delivery within 7-10 business days",
    features: ["BPA-Free", "Leak-Proof", "500ml Capacity", "Eco-Friendly"],
    availability: "in_stock",
    estimatedDelivery: "7-10 days",
    terms: "Valid for 6 months from redemption date. Non-transferable.",
    popularity: 95,
    trending: true,
    tags: ["sustainable", "daily-use", "eco-friendly"],
  },
  {
    id: 2,
    name: "₹100 Green Shopping Voucher",
    description:
      "Use this voucher at any of our partner eco-friendly stores. Valid for organic products, sustainable clothing, and more.",
    category: "vouchers",
    creditsRequired: 500,
    originalPrice: 100,
    discountPercentage: 0,
    stock: 1000,
    rating: 4.6,
    reviews: 89,
    image: "https://via.placeholder.com/300x200?text=Shopping+Voucher",
    images: ["https://via.placeholder.com/300x200?text=Voucher"],
    sponsor: "GreenMart Network",
    isPhysical: false,
    deliveryInfo: "Digital voucher sent instantly via email",
    features: ["No Expiry", "Partner Stores", "Instant Delivery"],
    availability: "in_stock",
    estimatedDelivery: "Instant",
    terms:
      "Valid at 500+ partner stores. Cannot be combined with other offers.",
    popularity: 88,
    trending: false,
    tags: ["instant", "shopping", "voucher"],
  },
  {
    id: 3,
    name: "Organic Vegetable Seeds Kit",
    description:
      "Complete kit with 10 varieties of organic vegetable seeds, including tomatoes, carrots, lettuce, and herbs. Perfect for home gardening.",
    category: "plants",
    creditsRequired: 200,
    originalPrice: 150,
    discountPercentage: 20,
    stock: 0, // Out of stock
    rating: 4.9,
    reviews: 67,
    image: "https://via.placeholder.com/300x200?text=Seeds+Kit",
    images: ["https://via.placeholder.com/300x200?text=Seeds+Kit"],
    sponsor: "Green Earth Foundation",
    isPhysical: true,
    deliveryInfo: "Carefully packaged for optimal germination",
    features: [
      "10 Varieties",
      "Organic Certified",
      "Growing Guide",
      "High Germination",
    ],
    availability: "out_of_stock",
    estimatedDelivery: "5-7 days",
    terms:
      "Best planted during monsoon season. Includes planting instructions.",
    popularity: 92,
    trending: true,
    tags: ["gardening", "organic", "home-grown"],
  },
  {
    id: 4,
    name: "Solar Power Bank",
    description:
      "10,000mAh solar power bank with dual USB ports and LED flashlight. Perfect for outdoor activities and emergency backup.",
    category: "electronics",
    creditsRequired: 800,
    originalPrice: 1200,
    discountPercentage: 15,
    stock: 25,
    rating: 4.4,
    reviews: 156,
    image: "https://via.placeholder.com/300x200?text=Solar+Power+Bank",
    images: ["https://via.placeholder.com/300x200?text=Solar+Power+Bank"],
    sponsor: "SolarTech India",
    isPhysical: true,
    deliveryInfo: "Express delivery within 3-5 days",
    features: ["Solar Charging", "10,000mAh", "Dual USB", "LED Flashlight"],
    availability: "in_stock",
    estimatedDelivery: "3-5 days",
    terms: "1 year warranty included. Water-resistant design.",
    popularity: 78,
    trending: false,
    tags: ["solar", "portable", "emergency"],
  },
  {
    id: 5,
    name: "Bamboo Cutlery Set",
    description:
      "Portable bamboo cutlery set with spoon, fork, knife, chopsticks, and straw. Comes with a hemp carry pouch.",
    category: "eco_products",
    creditsRequired: 120,
    originalPrice: 180,
    discountPercentage: 0,
    stock: 78,
    rating: 4.7,
    reviews: 203,
    image: "https://via.placeholder.com/300x200?text=Bamboo+Cutlery",
    images: ["https://via.placeholder.com/300x200?text=Bamboo+Cutlery"],
    sponsor: "BambooLife",
    isPhysical: true,
    deliveryInfo: "Standard delivery 5-7 days",
    features: ["100% Bamboo", "Portable", "Reusable", "Hemp Pouch"],
    availability: "in_stock",
    estimatedDelivery: "5-7 days",
    terms: "Easy to clean and maintain. Biodegradable materials.",
    popularity: 85,
    trending: true,
    tags: ["portable", "bamboo", "zero-waste"],
  },
  {
    id: 6,
    name: "30% Off Organic Food",
    description:
      "Get 30% discount on all organic food products at participating restaurants and cafes. Valid for 3 months.",
    category: "discounts",
    creditsRequired: 300,
    originalPrice: 0,
    discountPercentage: 30,
    stock: 500,
    rating: 4.5,
    reviews: 145,
    image: "https://via.placeholder.com/300x200?text=Food+Discount",
    images: ["https://via.placeholder.com/300x200?text=Food+Discount"],
    sponsor: "Organic Food Network",
    isPhysical: false,
    deliveryInfo: "Digital coupon code via SMS and email",
    features: ["30% Discount", "100+ Restaurants", "3 Month Validity"],
    availability: "in_stock",
    estimatedDelivery: "Instant",
    terms: "Valid on minimum order of ₹500. One use per visit.",
    popularity: 82,
    trending: false,
    tags: ["food", "discount", "restaurants"],
  },
];

const mockCategories = [
  { id: "all", name: "All Categories", icon: "🛒", count: 0 },
  { id: "eco_products", name: "Eco Products", icon: "🌱", count: 0 },
  { id: "vouchers", name: "Vouchers", icon: "🎫", count: 0 },
  { id: "discounts", name: "Discounts", icon: "💰", count: 0 },
  { id: "plants", name: "Plants & Seeds", icon: "🌿", count: 0 },
  { id: "electronics", name: "Electronics", icon: "📱", count: 0 },
  { id: "experiences", name: "Experiences", icon: "🎯", count: 0 },
];

const RewardStorePage = () => {
  const { user, hasCredits, updateUserCredits } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [filteredRewards, setFilteredRewards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rewardsPerPage] = useState(12);
  const [wishlist, setWishlist] = useState([]);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    // Load rewards from API
    const loadRewards = async () => {
      setIsLoading(true);
      try {
        // Load rewards and categories in parallel
        const [rewardsResponse, categoriesResponse] = await Promise.all([
          apiService.getRewards({
            page: 1,
            limit: 100, // Load more initially for better filtering
            isAvailable: true,
          }),
          apiService.getRewardCategories(),
        ]);

        if (rewardsResponse.success) {
          const rewardsData = rewardsResponse.data.rewards || [];

          // Transform backend data to frontend format
          const transformedRewards = rewardsData.map((reward) => ({
            id: reward._id,
            name: reward.name,
            description: reward.description,
            category: reward.category,
            creditsRequired: reward.pointsRequired || reward.pointsCost,
            originalPrice: reward.originalPrice || 0,
            discountPercentage: reward.pricing?.discount?.percentage || 0,
            stock: reward.stock?.available || reward.stock || 0,
            rating: reward.statistics?.averageRating || 4.5,
            reviews: reward.statistics?.totalRatings || 0,
            image:
              reward.images?.[0]?.url ||
              "https://via.placeholder.com/300x200?text=" +
                encodeURIComponent(reward.name),
            images: reward.images?.map((img) => img.url) || [],
            sponsor: reward.sponsor?.name || "Bin2Win",
            isPhysical: reward.deliveryInfo?.isPhysical || true,
            deliveryInfo: reward.deliveryInfo?.details || "Standard delivery",
            features: reward.features || [],
            availability: reward.isAvailable ? "in_stock" : "out_of_stock",
            estimatedDelivery: reward.deliveryInfo?.estimatedDays
              ? `${reward.deliveryInfo.estimatedDays} days`
              : "5-7 days",
            terms: reward.terms || "Standard terms and conditions apply.",
            popularity:
              reward.statistics?.popularityScore * 100 || Math.random() * 100,
            trending: reward.isFeatured || false,
            tags: reward.tags || [],
          }));

          setRewards(transformedRewards);
          setFilteredRewards(transformedRewards);
        }

        if (categoriesResponse.success) {
          const categoriesData = categoriesResponse.data || [];

          // Map backend categories to frontend format
          const categoryMap = {
            prasad: { name: "Prasad", icon: "🍯" },
            flowers: { name: "Flowers", icon: "🌸" },
            coconut: { name: "Coconut", icon: "🥥" },
            merchandise: { name: "Eco Products", icon: "🌱" },
            voucher: { name: "Vouchers", icon: "🎫" },
            experience: { name: "Experiences", icon: "🎯" },
            donation: { name: "Donations", icon: "💰" },
          };

          const transformedCategories = [
            { id: "all", name: "All Categories", icon: "🛒", count: 0 },
            ...categoriesData.map((cat) => ({
              id: cat._id || cat.name.toLowerCase(),
              name: categoryMap[cat.name]?.name || cat.name,
              icon: categoryMap[cat.name]?.icon || "📦",
              count: cat.count || 0,
            })),
          ];

          setCategories(transformedCategories);
        } else {
          // Fallback to mock categories
          setCategories(mockCategories);
        }

        // Load wishlist from localStorage
        const savedWishlist = localStorage.getItem("wishlist");
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist));
        }
      } catch (error) {
        console.error("Failed to load rewards:", error);
        toast.error("Failed to load rewards. Please try again.");

        // Fallback to mock data on error
        setRewards(mockRewards);
        setFilteredRewards(mockRewards);
        setCategories(mockCategories);
      } finally {
        setIsLoading(false);
      }
    };

    loadRewards();
  }, []);

  // Filter and search rewards
  useEffect(() => {
    let filtered = rewards.filter((reward) => {
      const matchesSearch =
        reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || reward.category === selectedCategory;
      const matchesPrice =
        reward.creditsRequired >= priceRange[0] &&
        reward.creditsRequired <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort rewards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return a.creditsRequired - b.creditsRequired;
        case "price_high":
          return b.creditsRequired - a.creditsRequired;
        case "rating":
          return b.rating - a.rating;
        case "popularity":
          return b.popularity - a.popularity;
        case "newest":
          return b.id - a.id;
        default:
          return b.popularity - a.popularity;
      }
    });

    setFilteredRewards(filtered);
    setCurrentPage(1);
  }, [rewards, searchTerm, selectedCategory, sortBy, priceRange]);

  const handleWishlistToggle = (rewardId) => {
    const newWishlist = wishlist.includes(rewardId)
      ? wishlist.filter((id) => id !== rewardId)
      : [...wishlist, rewardId];

    setWishlist(newWishlist);
    localStorage.setItem("wishlist", JSON.stringify(newWishlist));
  };

  const handleRedemption = async () => {
    if (!selectedReward || !hasCredits(selectedReward.creditsRequired)) {
      toast.error("Insufficient credits for this reward");
      return;
    }

    setIsRedeeming(true);
    try {
      // Call API to redeem reward
      const response = await apiService.redeemReward(selectedReward.id, {
        quantity: 1,
      });

      if (response.success) {
        // Update user credits
        const newCredits = user.greenCredits - selectedReward.creditsRequired;
        updateUserCredits(newCredits);

        // Update stock locally
        const updatedRewards = rewards.map((reward) =>
          reward.id === selectedReward.id
            ? { ...reward, stock: reward.stock - 1 }
            : reward
        );
        setRewards(updatedRewards);

        toast.success(`🎉 ${selectedReward.name} redeemed successfully!`);
        setShowRedemptionModal(false);
        setSelectedReward(null);
      } else {
        toast.error(response.message || "Redemption failed");
      }
    } catch (error) {
      console.error("Redemption failed:", error);
      toast.error(
        error.response?.data?.message || "Redemption failed. Please try again."
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-warning" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" />);
    }

    return stars;
  };

  const getAvailabilityBadge = (reward) => {
    if (reward.stock === 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    } else if (reward.stock <= 10) {
      return <Badge bg="warning">Low Stock</Badge>;
    } else if (reward.trending) {
      return <Badge bg="success">Trending</Badge>;
    }
    return null;
  };

  // Pagination
  const indexOfLastReward = currentPage * rewardsPerPage;
  const indexOfFirstReward = indexOfLastReward - rewardsPerPage;
  const currentRewards = filteredRewards.slice(
    indexOfFirstReward,
    indexOfLastReward
  );
  const totalPages = Math.ceil(filteredRewards.length / rewardsPerPage);

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading rewards...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">
            <FaStore className="text-primary me-2" />
            Reward Store
          </h2>
          <p className="text-muted mb-0">
            Redeem your green credits for eco-friendly rewards
          </p>
        </div>
        <Card className="border-0 bg-success text-white">
          <Card.Body className="p-3">
            <div className="d-flex align-items-center">
              <FaCoins className="me-2" size={20} />
              <div>
                <div className="fw-bold">
                  {user?.greenCredits?.toLocaleString() || 0}
                </div>
                <small>Green Credits</small>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Row>
        {/* Sidebar Filters */}
        <Col lg={3}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0">
              <h6 className="mb-0">
                <FaFilter className="me-2" />
                Filters
              </h6>
            </Card.Header>
            <Card.Body>
              {/* Search */}
              <Form.Group className="mb-3">
                <Form.Label>Search Rewards</Form.Label>
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
              </Form.Group>

              {/* Categories */}
              <Form.Group className="mb-3">
                <Form.Label>Categories</Form.Label>
                <div className="d-grid gap-1">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={
                        selectedCategory === category.id
                          ? "primary"
                          : "outline-secondary"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span>
                        <span className="me-2">{category.icon}</span>
                        {category.name}
                      </span>
                      <Badge bg="light" text="dark">
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </Form.Group>

              {/* Price Range */}
              <Form.Group className="mb-3">
                <Form.Label>Credit Range</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="number"
                    size="sm"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([
                        parseInt(e.target.value) || 0,
                        priceRange[1],
                      ])
                    }
                  />
                  <span>-</span>
                  <Form.Control
                    type="number"
                    size="sm"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([
                        priceRange[0],
                        parseInt(e.target.value) || 5000,
                      ])
                    }
                  />
                </div>
              </Form.Group>

              {/* Quick Actions */}
              <div className="d-grid gap-2">
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => setShowWishlistModal(true)}
                >
                  <FaHeart className="me-1" />
                  My Wishlist ({wishlist.length})
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => (window.location.href = "/orders")}
                >
                  <FaHistory className="me-1" />
                  Order History
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={9}>
          {/* Toolbar */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="text-muted">
                Showing {indexOfFirstReward + 1}-
                {Math.min(indexOfLastReward, filteredRewards.length)} of{" "}
                {filteredRewards.length} rewards
              </span>
            </div>
            <div className="d-flex gap-2">
              <Form.Select
                size="sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="popularity">Most Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </Form.Select>
            </div>
          </div>

          {/* Rewards Grid */}
          {currentRewards.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <FaGift size={60} className="text-muted mb-3" />
                <h5>No rewards found</h5>
                <p className="text-muted">
                  Try adjusting your filters or search terms
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setPriceRange([0, 5000]);
                  }}
                >
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row>
              {currentRewards.map((reward) => (
                <Col lg={4} md={6} key={reward.id} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm position-relative">
                    {/* Wishlist Button */}
                    <Button
                      variant="link"
                      size="sm"
                      className="position-absolute top-0 end-0 m-2 p-2 bg-white rounded-circle shadow-sm"
                      style={{ zIndex: 1 }}
                      onClick={() => handleWishlistToggle(reward.id)}
                    >
                      {wishlist.includes(reward.id) ? (
                        <FaHeart className="text-danger" />
                      ) : (
                        <FaRegHeart className="text-muted" />
                      )}
                    </Button>

                    {/* Availability Badge */}
                    {getAvailabilityBadge(reward) && (
                      <div
                        className="position-absolute top-0 start-0 m-2"
                        style={{ zIndex: 1 }}
                      >
                        {getAvailabilityBadge(reward)}
                      </div>
                    )}

                    <Image
                      src={reward.image}
                      alt={reward.name}
                      style={{ height: "200px", objectFit: "cover" }}
                      className="card-img-top"
                    />

                    <Card.Body className="d-flex flex-column">
                      <div className="mb-2">
                        <div className="d-flex align-items-center mb-1">
                          {getRatingStars(reward.rating)}
                          <small className="text-muted ms-2">
                            ({reward.reviews})
                          </small>
                        </div>
                        <h6 className="fw-bold mb-1">{reward.name}</h6>
                        <p
                          className="text-muted small mb-2"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {reward.description}
                        </p>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <FaCoins className="text-warning me-1" />
                            <span className="fw-bold text-primary">
                              {reward.creditsRequired}
                            </span>
                            <small className="text-muted ms-1">credits</small>
                          </div>
                          {reward.originalPrice > 0 && (
                            <div>
                              <small className="text-muted text-decoration-line-through">
                                ₹{reward.originalPrice}
                              </small>
                              {reward.discountPercentage > 0 && (
                                <Badge bg="danger" className="ms-1">
                                  {reward.discountPercentage}% OFF
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="d-grid gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              setSelectedReward(reward);
                              setShowDetailsModal(true);
                            }}
                          >
                            <FaEye className="me-1" />
                            View Details
                          </Button>

                          {reward.stock > 0 ? (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={!hasCredits(reward.creditsRequired)}
                              onClick={() => {
                                setSelectedReward(reward);
                                setShowRedemptionModal(true);
                              }}
                            >
                              <FaShoppingCart className="me-1" />
                              {hasCredits(reward.creditsRequired)
                                ? "Redeem Now"
                                : "Insufficient Credits"}
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" disabled>
                              <FaTimes className="me-1" />
                              Out of Stock
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

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
                  if (
                    page === currentPage ||
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
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
        </Col>
      </Row>

      {/* Reward Details Modal */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Reward Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReward && (
            <Row>
              <Col md={6}>
                <div className="mb-4">
                  <Image
                    src={selectedReward.image}
                    alt={selectedReward.name}
                    fluid
                    rounded
                    style={{
                      height: "300px",
                      width: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {selectedReward.images.length > 1 && (
                    <Row className="mt-2">
                      {selectedReward.images.slice(1).map((img, index) => (
                        <Col key={index} xs={4}>
                          <Image
                            src={img}
                            alt={`${selectedReward.name} ${index + 2}`}
                            fluid
                            rounded
                            style={{
                              height: "80px",
                              width: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Col>

              <Col md={6}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h4 className="fw-bold">{selectedReward.name}</h4>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleWishlistToggle(selectedReward.id)}
                    >
                      {wishlist.includes(selectedReward.id) ? (
                        <FaHeart className="text-danger" size={20} />
                      ) : (
                        <FaRegHeart className="text-muted" size={20} />
                      )}
                    </Button>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    {getRatingStars(selectedReward.rating)}
                    <span className="ms-2 fw-bold">
                      {selectedReward.rating}
                    </span>
                    <small className="text-muted ms-2">
                      ({selectedReward.reviews} reviews)
                    </small>
                  </div>

                  <p className="text-muted">{selectedReward.description}</p>
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <FaCoins className="text-warning me-2" size={20} />
                      <span className="h5 mb-0 fw-bold text-primary">
                        {selectedReward.creditsRequired}
                      </span>
                      <small className="text-muted ms-2">
                        credits required
                      </small>
                    </div>
                    {selectedReward.originalPrice > 0 && (
                      <div>
                        <span className="text-muted text-decoration-line-through">
                          ₹{selectedReward.originalPrice}
                        </span>
                        {selectedReward.discountPercentage > 0 && (
                          <Badge bg="danger" className="ms-2">
                            {selectedReward.discountPercentage}% OFF
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">Stock: </small>
                    <span
                      className={
                        selectedReward.stock > 10
                          ? "text-success"
                          : selectedReward.stock > 0
                          ? "text-warning"
                          : "text-danger"
                      }
                    >
                      {selectedReward.stock > 0
                        ? `${selectedReward.stock} available`
                        : "Out of stock"}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h6>Features:</h6>
                  <ul className="list-unstyled">
                    {selectedReward.features.map((feature, index) => (
                      <li key={index} className="mb-1">
                        <FaCheck className="text-success me-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-3">
                  <Row>
                    <Col sm={6}>
                      <div className="mb-2">
                        <small className="text-muted">Sponsor</small>
                        <div className="fw-medium">
                          {selectedReward.sponsor}
                        </div>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="mb-2">
                        <small className="text-muted">Delivery</small>
                        <div className="fw-medium">
                          {selectedReward.estimatedDelivery}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="mb-2">
                    <small className="text-muted">Delivery Info</small>
                    <div className="fw-medium">
                      {selectedReward.deliveryInfo}
                    </div>
                  </div>
                </div>

                <Alert variant="light" className="mb-3">
                  <small>
                    <strong>Terms:</strong> {selectedReward.terms}
                  </small>
                </Alert>

                <div className="d-grid">
                  {selectedReward.stock > 0 ? (
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={!hasCredits(selectedReward.creditsRequired)}
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowRedemptionModal(true);
                      }}
                    >
                      <FaShoppingCart className="me-2" />
                      {hasCredits(selectedReward.creditsRequired)
                        ? "Redeem Now"
                        : "Insufficient Credits"}
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" disabled>
                      <FaTimes className="me-2" />
                      Out of Stock
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* Redemption Confirmation Modal */}
      <Modal
        show={showRedemptionModal}
        onHide={() => setShowRedemptionModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Redemption</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReward && (
            <div>
              <div className="text-center mb-4">
                <Image
                  src={selectedReward.image}
                  alt={selectedReward.name}
                  width={100}
                  height={100}
                  rounded
                  style={{ objectFit: "cover" }}
                />
                <h5 className="mt-3">{selectedReward.name}</h5>
              </div>

              <div className="border rounded p-3 mb-3">
                <Row>
                  <Col>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Current Credits:</span>
                      <span className="fw-bold">
                        {user?.greenCredits?.toLocaleString()}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Required Credits:</span>
                      <span className="fw-bold text-danger">
                        -{selectedReward.creditsRequired.toLocaleString()}
                      </span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">Remaining Credits:</span>
                      <span className="fw-bold text-success">
                        {(
                          user?.greenCredits - selectedReward.creditsRequired
                        ).toLocaleString()}
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>

              <Alert variant="info">
                <div className="d-flex align-items-start">
                  <FaShippingFast className="me-2 mt-1" />
                  <div>
                    <strong>Delivery Information</strong>
                    <div>{selectedReward.deliveryInfo}</div>
                    <small className="text-muted">
                      Estimated delivery: {selectedReward.estimatedDelivery}
                    </small>
                  </div>
                </div>
              </Alert>

              <div className="text-center">
                <p className="text-muted mb-0">
                  Are you sure you want to redeem this reward?
                </p>
                <small className="text-muted">
                  This action cannot be undone.
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRedemptionModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleRedemption}
            disabled={isRedeeming}
          >
            {isRedeeming ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Redeeming...
              </>
            ) : (
              <>
                <FaCheck className="me-2" />
                Confirm Redemption
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Wishlist Modal */}
      <Modal
        show={showWishlistModal}
        onHide={() => setShowWishlistModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHeart className="text-danger me-2" />
            My Wishlist
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {wishlist.length === 0 ? (
            <div className="text-center py-5">
              <FaHeart size={60} className="text-muted mb-3" />
              <h5>Your wishlist is empty</h5>
              <p className="text-muted">Start adding rewards you like!</p>
            </div>
          ) : (
            <Row>
              {rewards
                .filter((reward) => wishlist.includes(reward.id))
                .map((reward) => (
                  <Col md={6} key={reward.id} className="mb-3">
                    <Card className="h-100">
                      <Row className="g-0">
                        <Col md={4}>
                          <Image
                            src={reward.image}
                            alt={reward.name}
                            style={{
                              height: "100px",
                              width: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Col>
                        <Col md={8}>
                          <Card.Body className="p-3">
                            <h6 className="fw-bold">{reward.name}</h6>
                            <div className="d-flex align-items-center mb-2">
                              <FaCoins className="text-warning me-1" />
                              <span className="fw-bold">
                                {reward.creditsRequired}
                              </span>
                            </div>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedReward(reward);
                                  setShowWishlistModal(false);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <FaEye />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleWishlistToggle(reward.id)}
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
            </Row>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RewardStorePage;
