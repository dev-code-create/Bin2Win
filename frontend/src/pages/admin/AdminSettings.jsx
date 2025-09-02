import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Modal,
  Table,
  Badge,
  InputGroup,
  Accordion,
  Switch,
  Spinner,
} from "react-bootstrap";
import {
  FaCog,
  FaSave,
  FaUserShield,
  FaPlus,
  FaEdit,
  FaTrash,
  FaBell,
  FaDatabase,
  FaShieldAlt,
  FaServer,
  FaEnvelope,
  FaSms,
  FaKey,
  FaDownload,
  FaUpload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaGlobe,
  FaPalette,
  FaCoins,
  FaPercent,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

const AdminSettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    appName: "Bin2Win",
    appDescription: "Waste Management & Rewards Platform",
    supportEmail: "support@bin2win.com",
    supportPhone: "+91-1800-123-4567",
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    maxFileUploadSize: 10, // MB
    sessionTimeout: 30, // minutes
  });

  const [pointsSettings, setPointsSettings] = useState({
    plastic: 10,
    paper: 5,
    metal: 15,
    glass: 8,
    organic: 3,
    electronic: 25,
    textile: 7,
    bonusMultiplier: 1.5,
    weeklyBonusThreshold: 10,
    monthlyBonusThreshold: 50,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminAlerts: true,
    submissionNotifications: true,
    rewardNotifications: true,
    systemAlerts: true,
    maintenanceAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    ipWhitelist: "",
    autoLogoutTime: 60,
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
    retentionDays: 30,
    lastBackup: "2024-01-21T10:30:00Z",
    backupLocation: "cloud-storage",
  });

  // Mock admin users data
  const [adminUsers, setAdminUsers] = useState([
    {
      id: 1,
      name: "Super Admin",
      email: "admin@bin2win.com",
      role: "super_admin",
      permissions: ["all"],
      status: "active",
      lastLogin: "2024-01-21T14:30:00Z",
      createdAt: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Regional Manager",
      email: "regional@bin2win.com",
      role: "admin",
      permissions: ["users", "submissions", "booths"],
      status: "active",
      lastLogin: "2024-01-21T12:15:00Z",
      createdAt: "2023-06-15T10:00:00Z",
    },
    {
      id: 3,
      name: "Content Moderator",
      email: "moderator@bin2win.com",
      role: "moderator",
      permissions: ["submissions", "reviews"],
      status: "active",
      lastLogin: "2024-01-21T11:45:00Z",
      createdAt: "2023-09-01T09:30:00Z",
    },
  ]);

  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    role: "moderator",
    permissions: [],
    sendWelcomeEmail: true,
  });

  const rolePermissions = {
    super_admin: ["all"],
    admin: ["users", "submissions", "booths", "rewards", "analytics"],
    moderator: ["submissions", "reviews"],
    viewer: ["analytics", "reports"],
  };

  const availablePermissions = [
    { value: "users", label: "User Management" },
    { value: "submissions", label: "Waste Submissions" },
    { value: "booths", label: "Booth Management" },
    { value: "rewards", label: "Rewards Management" },
    { value: "analytics", label: "Analytics & Reports" },
    { value: "settings", label: "System Settings" },
    { value: "reviews", label: "Content Reviews" },
  ];

  const handleSaveSettings = async (settingsType) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(
        `Saving ${settingsType} settings:`,
        settingsType === "general"
          ? generalSettings
          : settingsType === "points"
          ? pointsSettings
          : settingsType === "notifications"
          ? notificationSettings
          : settingsType === "security"
          ? securitySettings
          : backupSettings
      );
      alert(`${settingsType} settings saved successfully!`);
    } catch (error) {
      alert("Error saving settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    // Add admin logic here
    console.log("Adding new admin:", newAdminForm);
    setShowAddAdminModal(false);
    setNewAdminForm({
      name: "",
      email: "",
      role: "moderator",
      permissions: [],
      sendWelcomeEmail: true,
    });
  };

  const handleDeleteAdmin = async () => {
    // Delete admin logic here
    console.log("Deleting admin:", selectedAdmin.id);
    setShowDeleteModal(false);
    setSelectedAdmin(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "super_admin":
        return "danger";
      case "admin":
        return "primary";
      case "moderator":
        return "warning";
      case "viewer":
        return "info";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status) => {
    return status === "active" ? "success" : "secondary";
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">System Settings</h2>
          <p className="text-muted mb-0">
            Configure system preferences and admin accounts
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm">
            <FaDownload className="me-1" />
            Export Config
          </Button>
          <Button variant="outline-primary" size="sm">
            <FaServer className="me-1" />
            Backup Now
          </Button>
        </div>
      </div>

      <Row>
        {/* Settings Navigation */}
        <Col lg={3}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                    activeTab === "general" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("general")}
                >
                  <FaCog className="me-3" />
                  General Settings
                </button>
                <button
                  className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                    activeTab === "points" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("points")}
                >
                  <FaCoins className="me-3" />
                  Points System
                </button>
                <button
                  className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                    activeTab === "notifications" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("notifications")}
                >
                  <FaBell className="me-3" />
                  Notifications
                </button>
                <button
                  className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                    activeTab === "security" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("security")}
                >
                  <FaShieldAlt className="me-3" />
                  Security
                </button>
                <button
                  className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                    activeTab === "backup" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("backup")}
                >
                  <FaDatabase className="me-3" />
                  Backup & Data
                </button>
                <button
                  className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                    activeTab === "admins" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("admins")}
                >
                  <FaUserShield className="me-3" />
                  Admin Users
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Settings Content */}
        <Col lg={9}>
          {/* General Settings */}
          {activeTab === "general" && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0">
                  <FaCog className="me-2" />
                  General Settings
                </h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Application Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={generalSettings.appName}
                          onChange={(e) =>
                            setGeneralSettings((prev) => ({
                              ...prev,
                              appName: e.target.value,
                            }))
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Support Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={generalSettings.supportEmail}
                          onChange={(e) =>
                            setGeneralSettings((prev) => ({
                              ...prev,
                              supportEmail: e.target.value,
                            }))
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Application Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={generalSettings.appDescription}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          appDescription: e.target.value,
                        }))
                      }
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Support Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          value={generalSettings.supportPhone}
                          onChange={(e) =>
                            setGeneralSettings((prev) => ({
                              ...prev,
                              supportPhone: e.target.value,
                            }))
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max File Upload Size (MB)</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="100"
                          value={generalSettings.maxFileUploadSize}
                          onChange={(e) =>
                            setGeneralSettings((prev) => ({
                              ...prev,
                              maxFileUploadSize: parseInt(e.target.value),
                            }))
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="border rounded p-3 mb-3">
                    <h6 className="mb-3">System Controls</h6>
                    <Form.Check
                      type="switch"
                      label="Maintenance Mode"
                      checked={generalSettings.maintenanceMode}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          maintenanceMode: e.target.checked,
                        }))
                      }
                      className="mb-2"
                    />
                    <Form.Check
                      type="switch"
                      label="Allow New Registrations"
                      checked={generalSettings.allowNewRegistrations}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          allowNewRegistrations: e.target.checked,
                        }))
                      }
                      className="mb-2"
                    />
                    <Form.Check
                      type="switch"
                      label="Require Email Verification"
                      checked={generalSettings.requireEmailVerification}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          requireEmailVerification: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => handleSaveSettings("general")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      <FaSave className="me-2" />
                    )}
                    Save General Settings
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Points System */}
          {activeTab === "points" && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0">
                  <FaCoins className="me-2" />
                  Points System Configuration
                </h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Alert variant="info">
                    <strong>Note:</strong> Point values are calculated per
                    kilogram of waste submitted.
                  </Alert>

                  <div className="border rounded p-3 mb-4">
                    <h6 className="mb-3">Waste Type Point Values</h6>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Plastic (points/kg)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={pointsSettings.plastic}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                plastic: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Paper (points/kg)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={pointsSettings.paper}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                paper: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Metal (points/kg)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={pointsSettings.metal}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                metal: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Glass (points/kg)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={pointsSettings.glass}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                glass: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Organic (points/kg)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={pointsSettings.organic}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                organic: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Electronic (points/kg)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={pointsSettings.electronic}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                electronic: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="border rounded p-3 mb-4">
                    <h6 className="mb-3">Bonus System</h6>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Bonus Multiplier</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.1"
                            min="1"
                            max="3"
                            value={pointsSettings.bonusMultiplier}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                bonusMultiplier: parseFloat(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Weekly Bonus Threshold</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={pointsSettings.weeklyBonusThreshold}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                weeklyBonusThreshold: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Monthly Bonus Threshold</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={pointsSettings.monthlyBonusThreshold}
                            onChange={(e) =>
                              setPointsSettings((prev) => ({
                                ...prev,
                                monthlyBonusThreshold: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => handleSaveSettings("points")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      <FaSave className="me-2" />
                    )}
                    Save Points Settings
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0">
                  <FaShieldAlt className="me-2" />
                  Security Settings
                </h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <div className="border rounded p-3 mb-4">
                    <h6 className="mb-3">Password Policy</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Minimum Password Length</Form.Label>
                          <Form.Control
                            type="number"
                            min="6"
                            max="20"
                            value={securitySettings.passwordMinLength}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                passwordMinLength: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Max Login Attempts</Form.Label>
                          <Form.Control
                            type="number"
                            min="3"
                            max="10"
                            value={securitySettings.maxLoginAttempts}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                maxLoginAttempts: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Check
                      type="switch"
                      label="Require Special Characters"
                      checked={securitySettings.requireSpecialChars}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          requireSpecialChars: e.target.checked,
                        }))
                      }
                      className="mb-2"
                    />
                    <Form.Check
                      type="switch"
                      label="Require Numbers"
                      checked={securitySettings.requireNumbers}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          requireNumbers: e.target.checked,
                        }))
                      }
                      className="mb-2"
                    />
                    <Form.Check
                      type="switch"
                      label="Require Uppercase Letters"
                      checked={securitySettings.requireUppercase}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          requireUppercase: e.target.checked,
                        }))
                      }
                      className="mb-2"
                    />
                    <Form.Check
                      type="switch"
                      label="Two-Factor Authentication"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          twoFactorAuth: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <div className="border rounded p-3 mb-4">
                    <h6 className="mb-3">Session Management</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Session Timeout (minutes)</Form.Label>
                          <Form.Control
                            type="number"
                            min="5"
                            max="480"
                            value={securitySettings.sessionTimeout}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                sessionTimeout: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Auto Logout (minutes)</Form.Label>
                          <Form.Control
                            type="number"
                            min="15"
                            max="480"
                            value={securitySettings.autoLogoutTime}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                autoLogoutTime: parseInt(e.target.value),
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => handleSaveSettings("security")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      <FaSave className="me-2" />
                    )}
                    Save Security Settings
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Admin Users Management */}
          {activeTab === "admins" && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaUserShield className="me-2" />
                  Admin Users
                </h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddAdminModal(true)}
                >
                  <FaPlus className="me-1" />
                  Add Admin
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0">Admin</th>
                      <th className="border-0">Role</th>
                      <th className="border-0">Permissions</th>
                      <th className="border-0">Status</th>
                      <th className="border-0">Last Login</th>
                      <th className="border-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((admin) => (
                      <tr key={admin.id}>
                        <td className="border-0 py-3">
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <span className="text-white fw-bold">
                                {admin.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="fw-medium">{admin.name}</div>
                              <small className="text-muted">
                                {admin.email}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="border-0 py-3">
                          <Badge
                            bg={getRoleColor(admin.role)}
                            className="text-capitalize"
                          >
                            {admin.role.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="border-0 py-3">
                          <div className="d-flex flex-wrap gap-1">
                            {admin.permissions.includes("all") ? (
                              <Badge bg="danger">All Permissions</Badge>
                            ) : (
                              admin.permissions.map((permission) => (
                                <Badge
                                  key={permission}
                                  bg="secondary"
                                  className="text-capitalize"
                                >
                                  {permission}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="border-0 py-3">
                          <Badge
                            bg={getStatusColor(admin.status)}
                            className="text-capitalize"
                          >
                            {admin.status}
                          </Badge>
                        </td>
                        <td className="border-0 py-3">
                          <div>
                            <div>
                              {new Date(admin.lastLogin).toLocaleDateString()}
                            </div>
                            <small className="text-muted">
                              {new Date(admin.lastLogin).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </small>
                          </div>
                        </td>
                        <td className="border-0 py-3">
                          <div className="d-flex gap-1">
                            <Button variant="outline-primary" size="sm">
                              <FaEdit />
                            </Button>
                            {admin.id !== user?.id && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <FaTrash />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Add Admin Modal */}
      <Modal
        show={showAddAdminModal}
        onHide={() => setShowAddAdminModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Admin</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddAdmin}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newAdminForm.name}
                    onChange={(e) =>
                      setNewAdminForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    value={newAdminForm.email}
                    onChange={(e) =>
                      setNewAdminForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Role *</Form.Label>
              <Form.Select
                value={newAdminForm.role}
                onChange={(e) =>
                  setNewAdminForm((prev) => ({ ...prev, role: e.target.value }))
                }
                required
              >
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="viewer">Viewer</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Permissions</Form.Label>
              <div className="border rounded p-3">
                {availablePermissions.map((permission) => (
                  <Form.Check
                    key={permission.value}
                    type="checkbox"
                    id={`perm-${permission.value}`}
                    label={permission.label}
                    checked={newAdminForm.permissions.includes(
                      permission.value
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewAdminForm((prev) => ({
                          ...prev,
                          permissions: [...prev.permissions, permission.value],
                        }));
                      } else {
                        setNewAdminForm((prev) => ({
                          ...prev,
                          permissions: prev.permissions.filter(
                            (p) => p !== permission.value
                          ),
                        }));
                      }
                    }}
                    className="mb-2"
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Send welcome email with login credentials"
              checked={newAdminForm.sendWelcomeEmail}
              onChange={(e) =>
                setNewAdminForm((prev) => ({
                  ...prev,
                  sendWelcomeEmail: e.target.checked,
                }))
              }
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddAdminModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FaPlus className="me-1" />
              Add Admin
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Admin Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAdmin && (
            <Alert variant="warning">
              <FaExclamationTriangle className="me-2" />
              <strong>Warning!</strong> Are you sure you want to delete admin
              user <strong>{selectedAdmin.name}</strong>? This action cannot be
              undone.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAdmin}>
            <FaTrash className="me-1" />
            Delete Admin
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminSettings;
