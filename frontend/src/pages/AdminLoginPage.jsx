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
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaQrcode, FaUserShield } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!loginForm.username.trim()) {
      newErrors.username = "Username or email is required";
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiService.adminLogin(loginForm.username, loginForm.password);
      
      if (response.success) {
        await loginAdmin(response.data.admin, response.data.token);
        toast.success(`Welcome back, ${response.data.admin.fullName}!`);
        navigate("/admin/dashboard");
      } else {
        setErrors({ submit: response.message || "Admin login failed" });
        toast.error(response.message || "Admin login failed");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Admin login failed";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
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

  return (
    <div className="min-vh-100 d-flex align-items-center bg-primary bg-opacity-10">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-primary text-white text-center py-4">
                <div className="mb-3">
                  <FaUserShield size={48} />
                </div>
                <h2 className="mb-0">Admin Portal</h2>
                <p className="mb-0 opacity-75">Simhastha 2028 - Clean & Green</p>
                <small className="opacity-75">Booth Operator Login</small>
              </Card.Header>
              
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  {errors.submit && (
                    <Alert variant="danger" className="mb-3">
                      {errors.submit}
                    </Alert>
                  )}
                  
                  <div className="text-center mb-4">
                    <h4 className="text-primary">Booth Operator Access</h4>
                    <p className="text-muted mb-0">
                      Scan user QR codes and manage waste collections
                    </p>
                  </div>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Username or Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaUser />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="username"
                        value={loginForm.username}
                        onChange={handleInputChange}
                        placeholder="Enter your username or email"
                        isInvalid={!!errors.username}
                        disabled={isLoading}
                        autoComplete="username"
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
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        isInvalid={!!errors.password}
                        disabled={isLoading}
                        autoComplete="current-password"
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
                    variant="primary"
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
                      <>
                        <FaUserShield className="me-2" />
                        Login as Admin
                      </>
                    )}
                  </Button>

                  <div className="bg-light p-3 rounded text-center">
                    <h6 className="text-primary mb-2">
                      <FaQrcode className="me-2" />
                      Admin Features
                    </h6>
                    <small className="text-muted d-block">
                      • Scan user QR codes<br/>
                      • Record waste collections<br/>
                      • View collection statistics<br/>
                      • Manage booth operations
                    </small>
                  </div>
                </Form>
              </Card.Body>

              <Card.Footer className="bg-light text-center py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <Link to="/login" className="text-decoration-none small">
                    ← User Login
                  </Link>
                  <Link to="/" className="text-decoration-none small">
                    Back to Home
                  </Link>
                </div>
              </Card.Footer>
            </Card>

            <div className="text-center mt-4">
              <Alert variant="info" className="border-0 bg-primary bg-opacity-10">
                <small>
                  <strong>For Booth Operators Only</strong><br/>
                  Contact your supervisor for admin credentials
                </small>
              </Alert>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLoginPage;
