import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  InputGroup,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope, FaPhone } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({});

  const validateLoginForm = () => {
    const newErrors = {};

    if (!loginForm.username.trim()) {
      newErrors.username = "Username is required";
    } else if (loginForm.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required";
    } else if (loginForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors = {};

    if (!registerForm.username.trim()) {
      newErrors.username = "Username is required";
    } else if (registerForm.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(registerForm.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!registerForm.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (registerForm.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!registerForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (registerForm.phoneNumber && !/^[6-9]\d{9}$/.test(registerForm.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
    }

    if (!registerForm.password) {
      newErrors.password = "Password is required";
    } else if (registerForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!registerForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.login(loginForm.username, loginForm.password);
      
      if (response.success) {
        const { user, authToken } = response.data;
        login(user, authToken);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        username: registerForm.username,
        password: registerForm.password,
        name: registerForm.name,
        email: registerForm.email,
        phoneNumber: registerForm.phoneNumber || undefined,
      };

      const response = await apiService.register(userData);
      
      if (response.success) {
        const { user, authToken } = response.data;
        login(user, authToken);
        toast.success("Registration successful! Welcome to Simhastha Clean & Green!");
        navigate("/dashboard");
      } else {
        toast.error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-vh-100 bg-gradient-success d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col lg={6} md={8}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Header className="bg-white border-0 text-center py-4">
                <div className="mb-3">
                  <h1 className="h3 fw-bold text-success mb-2">
                    🌱 Simhastha Clean & Green
                  </h1>
                  <p className="text-muted mb-0">
                    Join the green revolution for a cleaner tomorrow
                  </p>
                </div>
              </Card.Header>
              
              <Card.Body className="p-4">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => {
                    setActiveTab(k);
                    setErrors({});
                  }}
                  className="nav-pills nav-justified mb-4"
                  fill
                >
                  <Tab eventKey="login" title="Login">
                    <Form onSubmit={handleLoginSubmit} className="mt-4">
                      <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaUser className="text-muted" />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            name="username"
                            value={loginForm.username}
                            onChange={handleLoginInputChange}
                            placeholder="Enter your username"
                            isInvalid={!!errors.username}
                            disabled={isLoading}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.username}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaLock className="text-muted" />
                          </InputGroup.Text>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={loginForm.password}
                            onChange={handleLoginInputChange}
                            placeholder="Enter your password"
                            isInvalid={!!errors.password}
                            disabled={isLoading}
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                          <Form.Control.Feedback type="invalid">
                            {errors.password}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>

                      <div className="d-grid">
                        <Button
                          type="submit"
                          variant="success"
                          size="lg"
                          disabled={isLoading}
                          className="fw-bold"
                        >
                          {isLoading ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                className="me-2"
                              />
                              Signing In...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Tab>

                  <Tab eventKey="register" title="Register">
                    <Form onSubmit={handleRegisterSubmit} className="mt-4">
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Username *</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>
                                <FaUser className="text-muted" />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                name="username"
                                value={registerForm.username}
                                onChange={handleRegisterInputChange}
                                placeholder="Choose a username"
                                isInvalid={!!errors.username}
                                disabled={isLoading}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.username}
                              </Form.Control.Feedback>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Full Name *</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={registerForm.name}
                              onChange={handleRegisterInputChange}
                              placeholder="Enter your full name"
                              isInvalid={!!errors.name}
                              disabled={isLoading}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.name}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Email Address *</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaEnvelope className="text-muted" />
                          </InputGroup.Text>
                          <Form.Control
                            type="email"
                            name="email"
                            value={registerForm.email}
                            onChange={handleRegisterInputChange}
                            placeholder="Enter your email"
                            isInvalid={!!errors.email}
                            disabled={isLoading}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.email}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number (Optional)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaPhone className="text-muted" />
                          </InputGroup.Text>
                          <Form.Control
                            type="tel"
                            name="phoneNumber"
                            value={registerForm.phoneNumber}
                            onChange={handleRegisterInputChange}
                            placeholder="Enter your phone number"
                            isInvalid={!!errors.phoneNumber}
                            disabled={isLoading}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phoneNumber}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Password *</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>
                                <FaLock className="text-muted" />
                              </InputGroup.Text>
                              <Form.Control
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={registerForm.password}
                                onChange={handleRegisterInputChange}
                                placeholder="Create a password"
                                isInvalid={!!errors.password}
                                disabled={isLoading}
                              />
                              <Button
                                variant="outline-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                              >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                              </Button>
                              <Form.Control.Feedback type="invalid">
                                {errors.password}
                              </Form.Control.Feedback>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Confirm Password *</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>
                                <FaLock className="text-muted" />
                              </InputGroup.Text>
                              <Form.Control
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={registerForm.confirmPassword}
                                onChange={handleRegisterInputChange}
                                placeholder="Confirm your password"
                                isInvalid={!!errors.confirmPassword}
                                disabled={isLoading}
                              />
                              <Button
                                variant="outline-secondary"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={isLoading}
                              >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                              </Button>
                              <Form.Control.Feedback type="invalid">
                                {errors.confirmPassword}
                              </Form.Control.Feedback>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-grid">
                        <Button
                          type="submit"
                          variant="success"
                          size="lg"
                          disabled={isLoading}
                          className="fw-bold"
                        >
                          {isLoading ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                className="me-2"
                              />
                              Creating Account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </div>

                      <div className="text-center mt-3">
                        <small className="text-muted">
                          By registering, you agree to our terms of service and privacy policy.
                        </small>
                      </div>
                    </Form>
                  </Tab>
                </Tabs>
              </Card.Body>

              <Card.Footer className="bg-light border-0 text-center py-3">
                <small className="text-muted">
                  Need help? Contact support at{" "}
                  <a href="mailto:support@simhastha.org" className="text-success">
                    support@simhastha.org
                  </a>
                </small>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
