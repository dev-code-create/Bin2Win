import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCamera, FaStop, FaQrcode, FaExclamationTriangle } from 'react-icons/fa';

const QRScanner = ({
  onScan,
  onScanFailure,
  isLoading = false,
  className = ''
}) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const elementId = 'qr-scanner-container';

  useEffect(() => {
    // Check camera permission
    checkCameraPermission();

    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current && isScanning) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading && hasPermission) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isLoading, hasPermission]);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
      setError('Camera access is required for QR scanning. Please allow camera permissions and refresh the page.');
    }
  };

  const startScanner = () => {
    if (isScanning || !hasPermission || isLoading) return;

    try {
      const scanner = new Html5QrcodeScanner(
        elementId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          supportedScanTypes: [0], // QR_CODE only
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText, decodedResult) => {
          // Success callback
          console.log('QR Code scanned:', decodedText);
          setError(null);
          
          if (onScan) {
            onScan(decodedText, decodedResult);
          }
          
          // Stop scanner after successful scan
          stopScanner();
        },
        (errorMessage) => {
          // Error callback - only log significant errors
          if (errorMessage.includes('NotFoundError') || 
              errorMessage.includes('No MultiFormat Readers')) {
            // These are common and expected, don't show to user
            return;
          }
          
          if (onScanFailure) {
            onScanFailure(errorMessage);
          }
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
      setError(null);
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setError('Failed to initialize QR scanner. Please check your camera permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && isScanning) {
      try {
        scannerRef.current.clear().then(() => {
          scannerRef.current = null;
          setIsScanning(false);
        }).catch((error) => {
          console.error('Error stopping scanner:', error);
          scannerRef.current = null;
          setIsScanning(false);
        });
      } catch (error) {
        console.error('Error stopping scanner:', error);
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setHasPermission(null);
    checkCameraPermission();
  };

  if (hasPermission === null) {
    return (
      <Card className={`text-center ${className}`}>
        <Card.Body className="py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h6>Checking camera permissions...</h6>
          <p className="text-muted mb-0">Please allow camera access when prompted</p>
        </Card.Body>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className={`text-center ${className}`}>
        <Card.Body className="py-5">
          <FaExclamationTriangle size={50} className="text-warning mb-3" />
          <h6>Camera Access Required</h6>
          <p className="text-muted mb-3">
            QR scanning requires camera access. Please allow camera permissions in your browser settings.
          </p>
          <div className="d-grid gap-2">
            <Button variant="primary" onClick={handleRetry}>
              <FaCamera className="me-2" />
              Try Again
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`text-center ${className}`}>
        <Card.Body className="py-4">
          <FaExclamationTriangle size={40} className="text-danger mb-3" />
          <h6>Scanner Error</h6>
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
          <Button variant="primary" onClick={handleRetry}>
            <FaCamera className="me-2" />
            Retry
          </Button>
        </Card.Body>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={`text-center ${className}`}>
        <Card.Body className="py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h6>Processing...</h6>
          <p className="text-muted mb-0">Please wait while we process your scan</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <Card.Header className="text-center">
          <h6 className="mb-0">
            <FaQrcode className="me-2" />
            QR Code Scanner
          </h6>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="qr-scanner-container">
            <div id={elementId}></div>
          </div>
          
          {isScanning && (
            <div className="text-center p-3 border-top">
              <p className="text-muted mb-2">
                Position the QR code within the frame to scan
              </p>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={stopScanner}
                disabled={isLoading}
              >
                <FaStop className="me-2" />
                Stop Scanner
              </Button>
            </div>
          )}
          
          {!isScanning && !isLoading && (
            <div className="text-center p-3 border-top">
              <p className="text-muted mb-2">
                Click to start scanning QR codes
              </p>
              <Button 
                variant="primary" 
                onClick={startScanner}
              >
                <FaCamera className="me-2" />
                Start Scanner
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default QRScanner;
