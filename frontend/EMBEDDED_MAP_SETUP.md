# Embedded Map Setup Guide

## 🗺️ Simple Embedded Map Integration

This guide shows how to use the simple embedded map that doesn't require any API keys or external services.

## ✅ What's Included

### Core Features

- **Embedded OpenStreetMap** - Free, open-source mapping service
- **Booth Markers** - Shows all collection booth locations
- **Interactive Elements** - Click booths for details and actions
- **Responsive Design** - Works on all devices
- **No API Keys Required** - Completely free to use

### Map Features

- 📍 **Booth Locations** - All booths displayed with markers
- 🎯 **Status Indicators** - Color-coded booth statuses
- 🔍 **Booth List Overlay** - Quick access to booth information
- 🚗 **Directions** - Get directions to any booth
- 📞 **Call Buttons** - Direct calling to booth numbers
- 🗺️ **Full Map Access** - Link to open full OpenStreetMap

## 🚀 How It Works

### 1. **OpenStreetMap Integration**

- Uses OpenStreetMap's free embed service
- Automatically calculates map bounds to show all booths
- Generates markers for each booth location
- No external dependencies or API calls

### 2. **Booth Display**

- Shows up to 5 nearby booths in the overlay
- Displays booth name, address, and status
- Color-coded status indicators
- Quick action buttons for directions and calling

### 3. **User Interaction**

- Click any booth in the overlay to select it
- Get directions to selected booths
- Call booth numbers directly
- View full map in new tab

## 🔧 Implementation Details

### Component Structure

```jsx
import SimpleMap from "../components/maps/SimpleMap";

<SimpleMap
  booths={filteredBooths}
  selectedBooth={selectedBooth}
  onBoothSelect={setSelectedBooth}
  userLocation={location}
  height="700px"
/>;
```

### Props

- `booths` - Array of booth objects with coordinates
- `selectedBooth` - Currently selected booth
- `onBoothSelect` - Callback when booth is selected
- `userLocation` - User's current location (optional)
- `height` - Map height (default: 400px)
- `className` - Additional CSS classes

### Booth Object Structure

```javascript
{
  id: "booth_id",
  name: "Booth Name",
  address: "Booth Address",
  coordinates: {
    latitude: 22.7196,
    longitude: 75.8577
  },
  status: "active", // active, busy, inactive, maintenance
  contactNumber: "+919876543210"
}
```

## 🎨 Customization Options

### Map Styling

```javascript
// Customize map appearance
const mapOptions = {
  height: "600px", // Map height
  className: "custom-map", // Custom CSS class
};
```

### Status Colors

```javascript
// Customize status colors
const statusColors = {
  active: "#28a745", // Green
  busy: "#ffc107", // Yellow
  inactive: "#dc3545", // Red
  maintenance: "#6c757d", // Gray
};
```

### Overlay Content

```javascript
// Customize booth overlay
const boothOverlay = {
  maxWidth: "300px", // Overlay width
  maxHeight: "400px", // Overlay height
  showCount: 5, // Number of booths to show
};
```

## 📱 Mobile Features

- **Touch Friendly** - All buttons sized for mobile
- **Responsive Layout** - Adapts to screen size
- **Scrollable Overlay** - Easy navigation on small screens
- **Optimized Performance** - Lightweight for mobile devices

## 🔍 Usage Examples

### Basic Implementation

```jsx
// Simple map with booths
<SimpleMap booths={booths} />

// Map with user location
<SimpleMap
  booths={booths}
  userLocation={userLocation}
/>

// Custom sized map
<SimpleMap
  booths={booths}
  height="800px"
/>
```

### With Event Handlers

```jsx
<SimpleMap
  booths={booths}
  selectedBooth={selectedBooth}
  onBoothSelect={(booth) => {
    console.log("Selected booth:", booth);
    setSelectedBooth(booth);
  }}
/>
```

## 🚨 Troubleshooting

### Common Issues

1. **Map Not Loading** - Check internet connection
2. **Booths Not Showing** - Verify booth coordinates in database
3. **Overlay Not Working** - Check booth data structure
4. **Performance Issues** - Limit number of booths if needed

### Debug Tips

```javascript
// Check booth data
console.log("Booths:", booths);

// Verify coordinates
booths.forEach((booth) => {
  if (booth.coordinates) {
    console.log(
      `${booth.name}: ${booth.coordinates.latitude}, ${booth.coordinates.longitude}`
    );
  }
});
```

## 🌟 Advantages

### Free & Open Source

- ✅ No API keys required
- ✅ No usage limits
- ✅ No billing setup
- ✅ OpenStreetMap data

### Easy Integration

- ✅ Simple component import
- ✅ Minimal configuration
- ✅ Automatic map generation
- ✅ Responsive design

### User Experience

- ✅ Fast loading
- ✅ Interactive elements
- ✅ Mobile optimized
- ✅ Professional appearance

## 📚 Additional Resources

- [OpenStreetMap](https://www.openstreetmap.org/)
- [OpenStreetMap Embed](https://wiki.openstreetmap.org/wiki/Embedding_OSM)
- [React Bootstrap](https://react-bootstrap.github.io/)
- [Font Awesome Icons](https://fontawesome.com/)

## 🔒 Privacy & Security

- **No Data Collection** - Map doesn't track user data
- **Open Source** - Transparent code and functionality
- **No External APIs** - All data stays within your application
- **HTTPS Compatible** - Works with secure connections

---

**Note**: This embedded map solution provides a professional mapping experience without any external dependencies or costs. Perfect for development, testing, and production use.
