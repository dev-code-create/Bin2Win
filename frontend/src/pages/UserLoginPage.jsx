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
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope, FaPhone, FaQrcode } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";

const UserLoginPage = () => {
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
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required";
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

    if (!registerForm.password) {
      newErrors.password = "Password is required";
    } else if (registerForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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

    if (registerForm.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(registerForm.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
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
    setErrors({});

    try {
      const response = await apiService.login(loginForm.username, loginForm.password);
      
      if (response.success) {
        await login(response.data.user, response.data.token);
        toast.success("Login successful! Welcome back!");
        navigate("/dashboard");
      } else {
        setErrors({ submit: response.message || "Login failed" });
        toast.error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Login failed";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
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
    setErrors({});

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
        const token = response.data.token || response.data.authToken;
        await login(response.data.user, token);
        toast.success("Registration successful! Welcome to Simhastha 2028!");
        navigate("/dashboard");
      } else {
        setErrors({ submit: response.message || "Registration failed" });
        toast.error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Registration failed";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-success text-white text-center py-4">
                <div className="mb-3">
                  <FaQrcode size={48} />
                </div>
                <h2 className="mb-0">Simhastha 2028</h2>
                <p className="mb-0 opacity-75">Clean & Green Initiative</p>
                <small className="opacity-75">User Portal</small>
              </Card.Header>
              
              <Card.Body className="p-4">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => {
                    setActiveTab(k);
                    setErrors({});
                  }}
                  className="mb-4"
                  fill
                >
                  <Tab eventKey="login" title="Login">
                    <Form onSubmit={handleLoginSubmit}>
                      {errors.submit && (
                        <Alert variant="danger" className="mb-3">
                          {errors.submit}
                        </Alert>
                      )}
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaUser />
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

                      <Form.Group className="mb-4">
                        <Form.Label>Password</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaLock />
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

                      <Button
                        type="submit"
                        variant="success"
                        size="lg"
                        className="w-100 mb-3"
                        disabled={isLoading}
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
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </Form>
                  </Tab>

                  <Tab eventKey="register" title="Register">
                    <Form onSubmit={handleRegisterSubmit}>
                      {errors.submit && (
                        <Alert variant="danger" className="mb-3">
                          {errors.submit}
                        </Alert>
                      )}
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>
                                <FaUser />
                              </InputGroup.Text>
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
                            </InputGroup>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>
                                <FaUser />
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
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaEnvelope />
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
                            <FaPhone />
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
                            <Form.Label>Password</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>
                                <FaLock />
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
                          <Form.Group className="mb-4">
                            <Form.Label>Confirm Password</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>
                                <FaLock />
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

                      <Button
                        type="submit"
                        variant="success"
                        size="lg"
                        className="w-100 mb-3"
                        disabled={isLoading}
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
                    </Form>
                  </Tab>
                </Tabs>

                <hr />
                <div className="text-center">
                  <p className="text-muted mb-2">Are you a booth operator?</p>
                  <Link to="/admin/login" className="btn btn-outline-primary">
                    Admin Login
                  </Link>
                </div>
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <Link to="/" className="text-decoration-none">
                ← Back to Home
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UserLoginPage;
