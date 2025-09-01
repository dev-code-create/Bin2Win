import React, { useCallback, useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaMapMarkerAlt, FaDirections, FaPhone, FaClock, FaWeightHanging } from 'react-icons/fa';

const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 22.7196, // Ujjain coordinates (Simhastha location)
  lng: 75.8577,
};

const GoogleMapComponent = ({
  booths,
  center = defaultCenter,
  zoom = 13,
  onBoothSelect,
  showUserLocation = true,
  userLocation,
  className = '',
  height = '400px',
  showRadius = false,
  radiusKm = 5,
  selectedBooth,
  onLocationUpdate,
}) => {
  const [map, setMap] = useState(null);
  const [selectedMarkerBooth, setSelectedMarkerBooth] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const mapRef = useRef(null);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Map options
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  };

  // Update map container style based on height prop
  const dynamicMapStyle = {
    ...mapContainerStyle,
    height: height,
  };

  useEffect(() => {
    if (!apiKey) {
      setLoadError('Google Maps API key is not configured');
    }
  }, [apiKey]);

  useEffect(() => {
    if (selectedBooth && map) {
      // Pan to selected booth
      const boothPosition = {
        lat: selectedBooth.coordinates?.latitude || defaultCenter.lat,
        lng: selectedBooth.coordinates?.longitude || defaultCenter.lng,
      };
      map.panTo(boothPosition);
      setSelectedMarkerBooth(selectedBooth);
    }
  }, [selectedBooth, map]);

  const onLoad = useCallback((map) => {
    setMap(map);
    setIsLoaded(true);

    // Fit map to show all booths if available
    if (booths && booths.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      booths.forEach((booth) => {
        if (booth.coordinates) {
          bounds.extend({
            lat: booth.coordinates.latitude,
            lng: booth.coordinates.longitude,
          });
        }
      });

      // Include user location in bounds if available
      if (userLocation) {
        bounds.extend({
          lat: userLocation.lat,
          lng: userLocation.lng,
        });
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [booths, userLocation]);

  const onUnmount = useCallback(() => {
    setMap(null);
    setIsLoaded(false);
  }, []);

  const handleMarkerClick = (booth) => {
    setSelectedMarkerBooth(booth);
    if (onBoothSelect) {
      onBoothSelect(booth);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedMarkerBooth(null);
  };

  const getDirections = (booth) => {
    if (!booth.coordinates) return;
    
    const destination = `${booth.coordinates.latitude},${booth.coordinates.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  const getMarkerIcon = (booth) => {
    let color = '#28a745'; // Default green for active
    
    switch (booth.status) {
      case 'active':
        color = '#28a745'; // Green
        break;
      case 'busy':
        color = '#ffc107'; // Yellow
        break;
      case 'inactive':
        color = '#dc3545'; // Red
        break;
      case 'maintenance':
        color = '#6c757d'; // Gray
        break;
      default:
        color = '#28a745';
    }

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
  };

  const getUserLocationIcon = () => {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: '#007bff',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'busy': return 'warning';
      case 'inactive': return 'danger';
      case 'maintenance': return 'secondary';
      default: return 'light';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Open';
      case 'busy': return 'Busy';
      case 'inactive': return 'Closed';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  const handleMapClick = (event) => {
    const clickedLat = event.latLng.lat();
    const clickedLng = event.latLng.lng();
    
    if (onLocationUpdate) {
      onLocationUpdate({
        lat: clickedLat,
        lng: clickedLng,
      });
    }
  };

  if (loadError) {
    return (
      <Alert variant="danger" className={className}>
        <h6>Map Loading Error</h6>
        <p className="mb-0">{loadError}</p>
      </Alert>
    );
  }

  if (!apiKey) {
    return (
      <Alert variant="warning" className={className}>
        <h6>Google Maps Configuration</h6>
        <p className="mb-0">
          Google Maps API key is required. Please configure REACT_APP_GOOGLE_MAPS_API_KEY in your environment.
        </p>
      </Alert>
    );
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      <LoadScript
        googleMapsApiKey={apiKey}
        libraries={libraries}
        loadingElement={
          <div className="d-flex justify-content-center align-items-center" style={dynamicMapStyle}>
            <Spinner animation="border" variant="primary" />
          </div>
        }
      >
        <GoogleMap
          ref={mapRef}
          mapContainerStyle={dynamicMapStyle}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
          onClick={handleMapClick}
        >
          {/* Collection Booth Markers */}
          {booths.map((booth) => (
            booth.coordinates && (
              <Marker
                key={booth.id}
                position={{
                  lat: booth.coordinates.latitude,
                  lng: booth.coordinates.longitude,
                }}
                onClick={() => handleMarkerClick(booth)}
                icon={isLoaded ? getMarkerIcon(booth) : undefined}
                title={booth.name}
              />
            )
          ))}

          {/* User Location Marker */}
          {showUserLocation && userLocation && (
            <Marker
              position={userLocation}
              icon={isLoaded ? getUserLocationIcon() : undefined}
              title="Your Location"
            />
          )}

          {/* Radius Circle */}
          {showRadius && userLocation && (
            <Circle
              center={userLocation}
              radius={radiusKm * 1000} // Convert km to meters
              options={{
                fillColor: '#007bff',
                fillOpacity: 0.1,
                strokeColor: '#007bff',
                strokeOpacity: 0.3,
                strokeWeight: 1,
              }}
            />
          )}

          {/* Info Window for Selected Booth */}
          {selectedMarkerBooth && selectedMarkerBooth.coordinates && (
            <InfoWindow
              position={{
                lat: selectedMarkerBooth.coordinates.latitude,
                lng: selectedMarkerBooth.coordinates.longitude,
              }}
              onCloseClick={handleInfoWindowClose}
            >
              <Card style={{ width: '280px', border: 'none' }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <h6 className="fw-bold mb-1">{selectedMarkerBooth.name}</h6>
                    <Badge bg={getStatusColor(selectedMarkerBooth.status)}>
                      {getStatusText(selectedMarkerBooth.status)}
                    </Badge>
                  </div>
                  
                  <p className="text-muted small mb-2">{selectedMarkerBooth.address}</p>
                  
                  {selectedMarkerBooth.operatingHours && (
                    <div className="d-flex align-items-center text-muted small mb-2">
                      <FaClock className="me-1" />
                      {selectedMarkerBooth.operatingHours.open} - {selectedMarkerBooth.operatingHours.close}
                    </div>
                  )}

                  {selectedMarkerBooth.contactNumber && (
                    <div className="d-flex align-items-center text-muted small mb-2">
                      <FaPhone className="me-1" />
                      {selectedMarkerBooth.contactNumber}
                    </div>
                  )}

                  {selectedMarkerBooth.acceptedWasteTypes && (
                    <div className="mb-2">
                      <div className="d-flex flex-wrap gap-1">
                        {selectedMarkerBooth.acceptedWasteTypes.slice(0, 3).map((type) => (
                          <Badge key={type} bg="secondary" className="text-capitalize small">
                            {type}
                          </Badge>
                        ))}
                        {selectedMarkerBooth.acceptedWasteTypes.length > 3 && (
                          <Badge bg="light" text="dark" className="small">
                            +{selectedMarkerBooth.acceptedWasteTypes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => getDirections(selectedMarkerBooth)}
                    >
                      <FaDirections className="me-1" />
                      Directions
                    </Button>
                    {selectedMarkerBooth.contactNumber && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => window.open(`tel:${selectedMarkerBooth.contactNumber}`)}
                      >
                        <FaPhone className="me-1" />
                        Call
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Map Legend */}
      <div 
        className="position-absolute bg-white rounded shadow-sm p-2" 
        style={{ bottom: '10px', left: '10px', fontSize: '12px' }}
      >
        <div className="fw-bold mb-1">Booth Status</div>
        <div className="d-flex align-items-center mb-1">
          <div 
            className="rounded-circle me-2" 
            style={{ width: '10px', height: '10px', backgroundColor: '#28a745' }}
          ></div>
          <span>Open</span>
        </div>
        <div className="d-flex align-items-center mb-1">
          <div 
            className="rounded-circle me-2" 
            style={{ width: '10px', height: '10px', backgroundColor: '#ffc107' }}
          ></div>
          <span>Busy</span>
        </div>
        <div className="d-flex align-items-center mb-1">
          <div 
            className="rounded-circle me-2" 
            style={{ width: '10px', height: '10px', backgroundColor: '#dc3545' }}
          ></div>
          <span>Closed</span>
        </div>
        {showUserLocation && userLocation && (
          <div className="d-flex align-items-center">
            <div 
              className="rounded-circle me-2" 
              style={{ width: '10px', height: '10px', backgroundColor: '#007bff' }}
            ></div>
            <span>Your Location</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleMapComponent;
