import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./QRCodeScanner.css";
import {
  Card,
  Button,
  Form,
  InputGroup,
  Alert,
  Row,
  Col,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import {
  FaCamera,
  FaKeyboard,
  FaQrcode,
  FaStop,
  FaPlay,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

const QRCodeScanner = ({
  onScan,
  onError,
  isLoading = false,
  className = "",
  placeholder = "Enter QR code here...",
}) => {
  const [activeTab, setActiveTab] = useState("camera");
  const [manualInput, setManualInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const scannerRef = useRef(null);
  const scannerElementId = "qr-scanner-container";

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (activeTab === "camera" && !isLoading) {
      // Always check permission when camera tab is selected
      if (hasPermission === null) {
        checkCameraPermission();
      } else if (hasPermission === true && !isScanning) {
        // If permission was granted but we're not scanning, and this is a fresh load
        console.log("Permission already granted, ready to start scanner");
      }
    } else {
      stopScanner();
    }
  }, [activeTab, isLoading, hasPermission, isScanning]);

  // Trigger permission check on component mount if camera tab is active
  useEffect(() => {
    if (activeTab === "camera" && hasPermission === null) {
      // Add a small delay to ensure the component is fully mounted
      setTimeout(() => {
        checkCameraPermission();
      }, 100);
    }
  }, [activeTab, hasPermission]);

  const checkCameraPermission = async () => {
    console.log("Checking camera permission...");

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia not supported");
        setHasPermission(false);
        setCameraError("Camera is not supported on this device or browser.");
        return;
      }

      // Check permission status first if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({
            name: "camera",
          });
          console.log("Camera permission status:", permission.state);

          if (permission.state === "denied") {
            setHasPermission(false);
            setCameraError(
              "Camera access was permanently denied. Please enable camera permissions in your browser settings and refresh the page."
            );
            return;
          }
        } catch (permError) {
          console.warn("Could not check permission status:", permError);
        }
      }

      // Try to access camera with more permissive constraints first
      let stream;
      try {
        // Try with environment camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
        });
      } catch (envError) {
        console.warn("Environment camera failed, trying any camera:", envError);
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
        });
      }

      // Stop the stream immediately as we just wanted to check permission
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log("Stopped track:", track.label);
        });
      }

      setHasPermission(true);
      setCameraError(null);
      console.log("Camera permission granted successfully");
    } catch (error) {
      console.error("Camera permission error:", error);
      setHasPermission(false);

      // Provide specific error messages based on error type
      if (error.name === "NotAllowedError") {
        setCameraError(
          'Camera access was denied. Please click "Allow" when prompted for camera access, or check your browser settings if you previously blocked camera access.'
        );
      } else if (error.name === "NotFoundError") {
        setCameraError(
          "No camera found on this device. Please connect a camera or use manual entry instead."
        );
      } else if (error.name === "NotSupportedError") {
        setCameraError(
          "Camera is not supported on this browser. Please try a different browser or use manual entry instead."
        );
      } else if (error.name === "NotReadableError") {
        setCameraError(
          "Camera is already in use by another application. Please close other applications using the camera and try again."
        );
      } else if (error.name === "OverconstrainedError") {
        setCameraError(
          "Camera constraints could not be satisfied. Please try again or use manual entry."
        );
      } else {
        setCameraError(
          `Failed to access camera: ${
            error.message || error.name || "Unknown error"
          }. Please check your camera permissions and try again.`
        );
      }
    }
  };

  const startScanner = async () => {
    if (isScanning || !hasPermission || isLoading) return;

    try {
      // Clear any existing scanner
      stopScanner();

      // Set scanning state first to trigger re-render and show the scanner element
      setIsScanning(true);
      setCameraError(null);

      // Wait a bit to ensure DOM is ready and element is rendered
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check if camera is accessible one more time before starting scanner
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        stream.getTracks().forEach((track) => track.stop());
      } catch (permError) {
        console.error("Camera access failed during scanner start:", permError);
        setCameraError(
          "Camera access denied. Please refresh the page and allow camera permissions."
        );
        setHasPermission(false);
        return;
      }

      console.log("Creating Html5QrcodeScanner instance...");
      const config = {
        fps: 10,
        // Disable the default qrbox to use our custom overlay instead
        qrbox: function (viewfinderWidth, viewfinderHeight) {
          // Return a larger area to scan the entire viewfinder
          // Our custom green frame will provide visual guidance
          return {
            width: Math.min(viewfinderWidth * 0.9, 400),
            height: Math.min(viewfinderHeight * 0.9, 400),
          };
        },
        aspectRatio: 1.777, // 16:9 aspect ratio for better camera compatibility
        disableFlip: false,
        supportedScanTypes: [0], // QR_CODE only
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false,
        rememberLastUsedCamera: true,
        // Optimized video constraints for QR scanning
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
        },
      };

      console.log("Scanner config:", config);
      console.log("Scanner element ID:", scannerElementId);

      // Check if scanner element exists in DOM
      let scannerElement = document.getElementById(scannerElementId);
      let retries = 0;
      const maxRetries = 10;

      // Wait for element to be available with retries
      while (!scannerElement && retries < maxRetries) {
        console.log(
          `Scanner element not found, retry ${retries + 1}/${maxRetries}`
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        scannerElement = document.getElementById(scannerElementId);
        retries++;
      }

      if (!scannerElement) {
        throw new Error(
          `Scanner element with ID '${scannerElementId}' not found in DOM after ${maxRetries} retries`
        );
      }

      console.log("Scanner element found:", scannerElement);

      const scanner = new Html5QrcodeScanner(
        scannerElementId,
        config,
        false // Disable verbose logging to reduce noise
      );

      console.log("Setting up scanner render callbacks...");

      try {
        scanner.render(
          (decodedText, decodedResult) => {
            console.log("QR Code scanned successfully:", decodedText);
            setCameraError(null);

            if (onScan) {
              onScan(decodedText);
            }

            // Auto-stop scanner after successful scan
            stopScanner();
          },
          (errorMessage) => {
            console.log("Scanner error callback triggered:", errorMessage);

            // Only show significant errors, ignore common scanning errors
            if (
              !errorMessage.includes("NotFoundError") &&
              !errorMessage.includes("No MultiFormat Readers") &&
              !errorMessage.includes("NotFoundException") &&
              !errorMessage.includes("No QR code found")
            ) {
              console.error("Significant QR scan error:", errorMessage);

              // Check for permission errors in scanning
              if (
                errorMessage.includes("Permission") ||
                errorMessage.includes("NotAllowedError") ||
                errorMessage.includes("getUserMedia")
              ) {
                console.error("Permission error during scanning");
                setCameraError(
                  "Camera permission was revoked. Please refresh the page and allow camera access."
                );
                setHasPermission(false);
                stopScanner();
              }
            }
          }
        );

        console.log("Scanner render setup completed successfully");
        setCameraError(null);
      } catch (renderError) {
        console.error("Scanner render setup failed:", renderError);

        // Check specific error types
        if (renderError.message) {
          if (
            renderError.message.includes("Permission") ||
            renderError.message.includes("NotAllowedError")
          ) {
            setCameraError(
              "Camera permission denied during initialization. Please refresh the page and allow camera access."
            );
            setHasPermission(false);
          } else if (renderError.message.includes("NotFoundError")) {
            setCameraError(
              "No camera device found. Please ensure a camera is connected."
            );
          } else if (renderError.message.includes("NotSupportedError")) {
            setCameraError(
              "Camera is not supported in this browser. Please try a different browser."
            );
          } else {
            setCameraError(
              `Scanner initialization failed: ${renderError.message}`
            );
          }
        } else {
          setCameraError(
            "Failed to initialize camera scanner. Please try refreshing the page."
          );
        }
        setIsScanning(false);
        throw renderError;
      }

      scannerRef.current = scanner;
      console.log("Scanner instance created and stored");
    } catch (error) {
      console.error("Scanner initialization error:", error);

      // Provide more specific error messages
      if (error.message && error.message.includes("Permission")) {
        setCameraError(
          "Camera permission was denied. Please refresh the page and allow camera access when prompted."
        );
        setHasPermission(false);
      } else if (error.message && error.message.includes("NotFoundError")) {
        setCameraError(
          "No camera found on this device. Please use manual entry instead."
        );
      } else if (error.message && error.message.includes("NotSupportedError")) {
        setCameraError(
          "Camera scanning is not supported on this browser. Please use manual entry instead."
        );
      } else {
        setCameraError(
          `Failed to initialize QR scanner: ${
            error.message || "Unknown error"
          }. Try refreshing the page or use manual entry.`
        );
      }
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      if (onError) {
        onError("Please enter a QR code");
      }
      return;
    }

    if (onScan) {
      onScan(manualInput.trim());
    }
    setManualInput("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== "camera") {
      stopScanner();
    } else {
      // When switching to camera tab, check permissions if not already checked
      if (hasPermission === null) {
        checkCameraPermission();
      }
    }
    setCameraError(null);
  };

  return (
    <Card className={`qr-scanner-card ${className}`}>
      <Card.Header className="bg-success text-white">
        <div className="d-flex align-items-center">
          <FaQrcode className="me-2" />
          <h5 className="mb-0">QR Code Scanner</h5>
        </div>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          Scan or enter a user's QR code to continue
        </p>

        <Tabs
          activeKey={activeTab}
          onSelect={handleTabChange}
          className="mb-3"
          fill
        >
          {/* Camera Scanning Tab */}
          <Tab
            eventKey="camera"
            title={
              <span>
                <FaCamera className="me-2" />
                Camera Scan
              </span>
            }
          >
            <div className="camera-scanner-section">
              {cameraError && (
                <Alert variant="warning" className="mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <FaExclamationTriangle className="me-2" />
                      {cameraError}
                    </div>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => {
                        setCameraError(null);
                        setHasPermission(null);
                        checkCameraPermission();
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </Alert>
              )}

              {hasPermission === false && (
                <div className="text-center py-4">
                  <FaExclamationTriangle
                    size={48}
                    className="text-warning mb-3"
                  />
                  <h6>Camera Permission Required</h6>
                  <p className="text-muted mb-3">
                    Please allow camera access to scan QR codes
                  </p>
                  <div className="d-flex flex-column gap-2 align-items-center">
                    <Button
                      variant="primary"
                      onClick={checkCameraPermission}
                      size="lg"
                    >
                      <FaCamera className="me-2" />
                      Grant Camera Permission
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => window.location.reload()}
                      size="sm"
                    >
                      Refresh Page
                    </Button>
                    <small className="text-muted">
                      Or use the "Manual Entry" tab to enter QR codes manually
                    </small>
                  </div>
                </div>
              )}

              {hasPermission === true && (
                <div>
                  {/* Always render the scanner container but show/hide it */}
                  <div
                    id={scannerElementId}
                    className="qr-scanner-container mb-3"
                    style={{
                      display: isScanning ? "block" : "none",
                      minHeight: isScanning ? "360px" : "0px",
                    }}
                  />

                  {!isScanning ? (
                    <div className="text-center py-4">
                      <FaCamera size={48} className="text-muted mb-3" />
                      <h6>Ready to Scan</h6>
                      <p className="text-muted mb-3">
                        Click start to begin scanning QR codes
                      </p>
                      <Button
                        variant="success"
                        onClick={startScanner}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FaPlay className="me-2" />
                            Start Camera
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mb-3">
                        <small className="text-muted d-block mb-2">
                          <strong>
                            📱 Hold your QR code within the green frame
                          </strong>
                        </small>
                        <small className="text-muted d-block">
                          Position the QR code clearly in the center and ensure
                          good lighting
                        </small>
                      </div>
                      <Button
                        variant="outline-danger"
                        onClick={stopScanner}
                        size="sm"
                      >
                        <FaStop className="me-2" />
                        Stop Scanner
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {hasPermission === null && (
                <div className="text-center py-4">
                  <Spinner animation="border" className="mb-3" />
                  <p className="text-muted mb-3">
                    Checking camera permissions...
                  </p>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={checkCameraPermission}
                  >
                    Request Camera Permission
                  </Button>
                </div>
              )}
            </div>
          </Tab>

          {/* Manual Entry Tab */}
          <Tab
            eventKey="manual"
            title={
              <span>
                <FaKeyboard className="me-2" />
                Manual Entry
              </span>
            }
          >
            <div className="manual-entry-section">
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleManualSubmit();
                }}
              >
                <Row>
                  <Col>
                    <Form.Label>Enter QR Code</Form.Label>
                    <InputGroup className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder={placeholder}
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                      />
                      <Button
                        variant="success"
                        onClick={handleManualSubmit}
                        disabled={isLoading || !manualInput.trim()}
                        type="submit"
                      >
                        {isLoading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="me-2" />
                            Submit
                          </>
                        )}
                      </Button>
                    </InputGroup>
                  </Col>
                </Row>

                <div className="mt-3">
                  <small className="text-muted">
                    <strong>QR Code Format:</strong> Typically starts with
                    "SIMHASTHA_USER_" followed by alphanumeric characters
                  </small>
                </div>
              </Form>
            </div>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
};

export default QRCodeScanner;
