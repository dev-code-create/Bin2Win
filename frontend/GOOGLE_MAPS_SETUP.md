# Google Maps Integration Setup Guide

## 🔑 Required Configuration

To use the embedded Google Maps in the booth location page, you need to set up a Google Maps API key.

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Go to "Credentials" and create an API key
5. Restrict the API key to your domain for security

### 2. Environment Configuration

Create a `.env` file in the `frontend` directory with:

```bash
# Google Maps API Configuration
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Other environment variables
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_APP_NAME=Simhastha 2028 Clean & Green
REACT_APP_APP_VERSION=1.0.0
```

### 3. API Key Restrictions (Recommended)

For security, restrict your API key:

- **HTTP referrers**: `localhost:3000/*`, `yourdomain.com/*`
- **API restrictions**: Only the APIs you need
- **Quota limits**: Set reasonable daily limits

## 🗺️ Features Available

The enhanced Google Maps integration includes:

### Core Features

- ✅ **Interactive Map**: Full-screen embedded Google Maps
- ✅ **Booth Markers**: Color-coded markers for different booth statuses
- ✅ **User Location**: Shows user's current location
- ✅ **Info Windows**: Detailed booth information on marker click
- ✅ **Directions**: Get directions to any booth

### Enhanced Controls

- 🎯 **Center on Location**: Button to center map on user location
- 🗺️ **Map Types**: Toggle between Roadmap, Satellite, Hybrid, Terrain
- 🚗 **Traffic Layer**: Show real-time traffic information
- 🚌 **Transit Layer**: Display public transportation routes
- 📍 **Radius Filter**: Visual radius around user location

### User Experience

- 🔍 **Search & Filter**: Find booths by name, address, or area
- 📊 **Status Filtering**: Filter by booth status (Open, Busy, Closed, Maintenance)
- 📏 **Distance Sorting**: Sort booths by distance from user
- 🎨 **Responsive Design**: Works on all device sizes
- 📱 **Mobile Optimized**: Touch-friendly controls

## 🚀 Usage Instructions

### For Users

1. **Allow Location Access**: Grant location permission for nearby booth suggestions
2. **Search Booths**: Use the search bar to find specific booths
3. **Filter Results**: Use status and radius filters to narrow down options
4. **View on Map**: Click map view to see booth locations geographically
5. **Get Directions**: Click the directions button to open Google Maps navigation

### For Developers

1. **Install Dependencies**: Ensure `@react-google-maps/api` is installed
2. **Set API Key**: Configure `REACT_APP_GOOGLE_MAPS_API_KEY` in environment
3. **Customize Markers**: Modify marker icons and colors in `GoogleMap.jsx`
4. **Add Layers**: Extend with additional map layers as needed

## 🔧 Customization Options

### Marker Customization

```javascript
// Custom marker colors for different booth types
const getMarkerIcon = (booth) => {
  const colors = {
    active: "#28a745", // Green
    busy: "#ffc107", // Yellow
    inactive: "#dc3545", // Red
    maintenance: "#6c757d", // Gray
  };
  // ... marker configuration
};
```

### Map Styling

```javascript
// Custom map styles
const mapOptions = {
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    // Add more custom styles
  ],
};
```

## 📱 Mobile Considerations

- **Touch Gestures**: Pinch to zoom, swipe to pan
- **Responsive Controls**: Buttons sized for mobile interaction
- **Performance**: Optimized for mobile devices
- **Offline Support**: Basic functionality without internet

## 🚨 Troubleshooting

### Common Issues

1. **Map Not Loading**: Check API key configuration
2. **Markers Not Showing**: Verify booth coordinates in database
3. **Location Not Working**: Ensure HTTPS or localhost for geolocation
4. **Performance Issues**: Check API quota and usage limits

### Debug Mode

Enable debug logging by setting:

```javascript
const DEBUG_MODE = process.env.NODE_ENV === "development";
```

## 📚 Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps API](https://react-google-maps-api-docs.netlify.app/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Maps JavaScript API Pricing](https://cloud.google.com/maps-platform/pricing)

## 🔒 Security Best Practices

1. **API Key Restrictions**: Limit to specific domains and APIs
2. **Quota Management**: Set reasonable usage limits
3. **HTTPS Only**: Use HTTPS in production for geolocation
4. **Regular Monitoring**: Monitor API usage and costs
5. **Key Rotation**: Rotate API keys periodically

---

**Note**: This integration requires an active Google Maps API key with billing enabled. Monitor your usage to avoid unexpected charges.
