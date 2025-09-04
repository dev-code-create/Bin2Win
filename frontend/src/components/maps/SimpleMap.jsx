import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaMapMarkerAlt, FaDirections, FaPhone, FaClock } from 'react-icons/fa';

const SimpleMap = ({ 
  booths, 
  selectedBooth, 
  onBoothSelect, 
  userLocation, 
  height = '400px',
  className = '' 
}) => {
  
  // Default center (Ujjain, Madhya Pradesh)
  const defaultCenter = { lat: 22.7196, lng: 75.8577 };
  
  // Generate OpenStreetMap URL with markers
  const generateMapUrl = () => {
    if (!booths || booths.length === 0) {
      // Show default location if no booths
      return `https://www.openstreetmap.org/export/embed.html?bbox=${defaultCenter.lng - 0.01},${defaultCenter.lat - 0.01},${defaultCenter.lng + 0.01},${defaultCenter.lat + 0.01}&layer=mapnik&marker=${defaultCenter.lat},${defaultCenter.lng}`;
    }

    // Create markers for all booths
    const markers = booths
      .filter(booth => booth.coordinates)
      .map(booth => `${booth.coordinates.latitude},${booth.coordinates.longitude}`)
      .join('&marker=');

    // Calculate bounds to include all booths
    const lats = booths.filter(b => b.coordinates).map(b => b.coordinates.latitude);
    const lngs = booths.filter(b => b.coordinates).map(b => b.coordinates.longitude);
    
    if (lats.length > 0 && lngs.length > 0) {
      const minLat = Math.min(...lats) - 0.005;
      const maxLat = Math.max(...lats) + 0.005;
      const minLng = Math.min(...lngs) - 0.005;
      const maxLng = Math.max(...lngs) + 0.005;
      
      return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${markers}`;
    }

    return `https://www.openstreetmap.org/export/embed.html?bbox=${defaultCenter.lng - 0.01},${defaultCenter.lat - 0.01},${defaultCenter.lng + 0.01},${defaultCenter.lat + 0.01}&layer=mapnik&marker=${defaultCenter.lat},${defaultCenter.lng}`;
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

  const getDirections = (booth) => {
    if (!booth.coordinates) return;
    
    const destination = `${booth.coordinates.latitude},${booth.coordinates.longitude}`;
    const url = `https://www.openstreetmap.org/directions?from=&to=${destination}`;
    window.open(url, '_blank');
  };

  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* Embedded OpenStreetMap */}
      <div style={{ height: height, width: '100%', position: 'relative' }}>
        <iframe
          title="Collection Booths Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={generateMapUrl()}
          style={{ border: 'none' }}
        />
        
        {/* Map Attribution */}
        <div 
          className="position-absolute bg-white rounded shadow-sm p-2" 
          style={{ bottom: '10px', left: '10px', fontSize: '11px', maxWidth: '200px' }}
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
          <div className="d-flex align-items-center mb-1">
            <div 
              className="rounded-circle me-2" 
              style={{ width: '10px', height: '10px', backgroundColor: '#6c757d' }}
            ></div>
            <span>Maintenance</span>
          </div>
          {userLocation && (
            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle me-2" 
                style={{ width: '10px', height: '10px', backgroundColor: '#007bff' }}
              ></div>
              <span>Your Location</span>
            </div>
          )}
        </div>

        {/* Booth List Overlay */}
        <div 
          className="position-absolute bg-white rounded shadow-sm p-3" 
          style={{ top: '10px', right: '10px', maxWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}
        >
          <div className="fw-bold mb-2">Nearby Booths</div>
          {booths && booths.length > 0 ? (
            <div className="small">
              {booths.slice(0, 5).map((booth) => (
                <div 
                  key={booth.id} 
                  className={`p-2 rounded mb-2 cursor-pointer ${selectedBooth?.id === booth.id ? 'bg-primary text-white' : 'bg-light'}`}
                  onClick={() => onBoothSelect && onBoothSelect(booth)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <strong className="small">{booth.name}</strong>
                    <Badge 
                      bg={selectedBooth?.id === booth.id ? 'light' : getStatusColor(booth.status)} 
                      text={selectedBooth?.id === booth.id ? 'dark' : undefined}
                      className="small"
                    >
                      {getStatusText(booth.status)}
                    </Badge>
                  </div>
                  <div className={`small ${selectedBooth?.id === booth.id ? 'text-white-50' : 'text-muted'}`}>
                    {booth.address}
                  </div>
                  <div className="d-flex gap-1 mt-2">
                    <button
                      className={`btn btn-sm ${selectedBooth?.id === booth.id ? 'btn-light' : 'btn-outline-primary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        getDirections(booth);
                      }}
                      disabled={!booth.coordinates}
                    >
                      <FaDirections className="me-1" />
                      Directions
                    </button>
                    {booth.contactNumber && (
                      <button
                        className={`btn btn-sm ${selectedBooth?.id === booth.id ? 'btn-light' : 'btn-outline-success'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${booth.contactNumber}`);
                        }}
                      >
                        <FaPhone className="me-1" />
                        Call
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {booths.length > 5 && (
                <div className="text-center text-muted small">
                  +{booths.length - 5} more booths
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted small">
              No booths found
            </div>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <div className="position-absolute" style={{ top: '10px', left: '10px' }}>
        <div className="d-flex flex-column gap-2">
          <button
            className="btn btn-light btn-sm shadow-sm"
            onClick={() => window.open('https://www.openstreetmap.org/', '_blank')}
            title="Open full map"
          >
            <FaMapMarkerAlt />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;
