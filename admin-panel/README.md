# 🛡️ Simhastha Clean & Green - Admin Panel

Administrative dashboard for managing the Simhastha 2028 Clean & Green waste management system.

## 🚀 Features

### Dashboard
- System overview and statistics
- Real-time monitoring
- Quick actions and alerts
- Performance metrics and charts

### User Management
- View and manage user accounts
- Credit adjustments and account status
- User activity monitoring
- Registration analytics

### Waste Submission Management
- Review and approve/reject submissions
- Photo verification and quality scoring
- Batch operations and filtering
- Environmental impact tracking

### Collection Booth Management
- Booth location and status monitoring
- Capacity tracking and alerts
- QR code management
- Operating hours configuration

### Reward Catalog Management
- Reward creation and editing
- Stock management and tracking
- Category and sponsor management
- Redemption analytics

### Analytics & Reporting
- Detailed system analytics
- Custom date range reports
- Environmental impact metrics
- Data export functionality

### System Settings
- Admin account management
- System configuration
- Notification settings
- Maintenance tools

## 🔐 Access Levels

### Super Admin
- Full system access
- User and admin management
- System configuration
- All booth access

### Admin
- User management (limited)
- Submission verification
- Booth management
- Reward management

### Booth Operator
- Assigned booth management
- Submission verification for assigned booths
- Basic user information

### Moderator
- Content moderation
- Submission review
- User support

### Viewer
- Read-only access
- Analytics viewing
- Report generation

## 🛠️ Installation

1. Navigate to admin-panel directory:
```bash
cd admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

5. Start the development server:
```bash
npm start
```

The admin panel will be available at: http://localhost:3000

## 🔑 Demo Credentials

### Super Admin
- **Username:** admin
- **Password:** admin123

### Booth Operator
- **Username:** operator
- **Password:** operator123

## 📱 Mobile Support

The admin panel is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices

## 🎨 Features

### Modern UI/UX
- Clean, professional design
- Intuitive navigation
- Responsive layout
- Dark/light theme support

### Data Visualization
- Interactive charts and graphs
- Real-time data updates
- Export functionality
- Custom date ranges

### Security
- Role-based access control
- Secure authentication
- Session management
- Audit logging

### Performance
- Optimized loading
- Efficient data fetching
- Caching strategies
- Lazy loading

## 🔧 Configuration

### Environment Variables
- `REACT_APP_API_BASE_URL` - Backend API URL
- `REACT_APP_GOOGLE_MAPS_API_KEY` - Google Maps API key (for booth management)

### Customization
- Theme colors can be modified in `src/App.css`
- Component styling uses Bootstrap 5
- Charts powered by Recharts library

## 📊 Analytics

The admin panel provides comprehensive analytics:
- User registration trends
- Waste submission patterns
- Booth utilization rates
- Reward redemption statistics
- Environmental impact metrics

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Configure build settings
3. Set environment variables
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For admin panel issues:
- Check the console for errors
- Verify API connectivity
- Contact system administrator
- Review user permissions

---

**Built for efficient waste management administration** 🌱