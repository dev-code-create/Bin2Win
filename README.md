# 🌱 Simhastha 2028 Clean & Green

A comprehensive waste management incentive system for Simhastha 2028 that rewards devotees with Green Credit points for proper waste disposal, which can be redeemed for religious items and eco-friendly gifts.

## 🎯 Purpose

- Encourage people to throw waste properly at collection booths
- Earn Green Credit points → redeem eco-friendly gifts (coconut, flowers, prasad)
- Reduce litter, involve devotees, and keep the event eco-friendly & safe

## 💡 Concept Flow

**Devotee ➝ Booth ➝ QR Scan ➝ Points ➝ Gifts ➝ Recycling**

## 🏗️ Project Structure

```
simhastha-clean-green/
├── frontend/          # React.js application
├── backend/           # Node.js + Express API
├── admin-panel/       # Admin dashboard (React)
└── documentation/     # Project docs
```

## 🚀 Technology Stack

### Backend
- **Framework**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT + Bcrypt
- **File Upload**: Multer
- **API Documentation**: RESTful API

### Frontend
- **Framework**: React.js with TypeScript
- **Routing**: React Router DOM
- **UI Components**: React Bootstrap
- **HTTP Client**: Axios
- **QR Scanner**: HTML5 QR Code Scanner
- **Maps**: Google Maps API
- **Notifications**: React Toastify

### Features
- **User Authentication**: OTP-based phone number verification
- **Waste Submission**: QR code scanning and photo upload
- **Green Credits Wallet**: Points earning and spending system
- **Reward Store**: Redeem gifts with points
- **Booth Locator**: Find nearby collection booths with Google Maps
- **Leaderboard**: Competitive rankings
- **Admin Panel**: Manage users, booths, and rewards
- **Mobile-Friendly**: Responsive design for all devices

## 📱 Key Features

### For Users
- **User Registration/Login**: OTP-based authentication
- **Waste Submission**: Scan QR codes at booths and submit waste details
- **Green Credit Wallet**: Track earned and spent points
- **Reward Store**: Browse and redeem eco-friendly rewards
- **Booth Locator**: Find nearby collection booths with real-time status
- **History**: View submission and redemption history
- **Leaderboard**: See rankings and compete with other users
- **Profile Management**: Update personal information and preferences

### For Admins
- **Dashboard**: System overview and analytics
- **User Management**: View and manage user accounts
- **Booth Management**: Add, edit, and monitor collection booths
- **Reward Management**: Manage reward catalog and inventory
- **Waste Verification**: Approve/reject waste submissions
- **Analytics**: Detailed reports and statistics
- **System Settings**: Configure application settings

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/simhastha_clean_green
JWT_SECRET=your-super-secret-jwt-key
```

5. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

5. Start the frontend development server:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🗄️ Database Schema

### Users Collection
- User profiles and authentication
- Green credits balance
- Waste submission statistics
- User preferences and settings

### Waste Submissions Collection
- Waste disposal records
- Points calculation
- Verification status
- Photos and metadata

### Collection Booths Collection
- Booth locations and details
- Operating hours and capacity
- Real-time status and statistics
- QR codes for identification

### Rewards Collection
- Available rewards catalog
- Point requirements and stock
- Categories and descriptions
- Sponsor information

### Transactions Collection
- Points earning and spending history
- Transaction references
- Balance tracking

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/credits` - Get green credits balance
- `GET /api/user/history` - Get user history
- `GET /api/user/stats` - Get user statistics

### Waste Management
- `POST /api/waste/submit` - Submit waste disposal
- `GET /api/waste/submissions` - Get user submissions
- `GET /api/waste/stats` - Get waste statistics

### Collection Booths
- `GET /api/booths` - Get all booths
- `GET /api/booths/nearby` - Get nearby booths
- `GET /api/booths/:id` - Get specific booth
- `POST /api/booths/scan` - Validate QR code

### Rewards
- `GET /api/rewards` - Get available rewards
- `GET /api/rewards/:id` - Get specific reward
- `POST /api/rewards/redeem` - Redeem reward
- `GET /api/rewards/history` - Get redemption history

## 📊 Points System

### Earning Points
- **Plastic**: 10 points per kg
- **Organic**: 5 points per kg
- **Paper**: 8 points per kg
- **Metal**: 15 points per kg
- **Glass**: 12 points per kg
- **Electronic**: 20 points per kg
- **Textile**: 6 points per kg
- **Hazardous**: 25 points per kg

### Bonus Points
- **Large quantities**: 10-20% bonus for 5kg+ submissions
- **Quality bonus**: Extra points for well-segregated waste
- **Consistency bonus**: Regular submission rewards

### Ranking System
- **Bronze**: 0-499 points
- **Silver**: 500-1999 points
- **Gold**: 2000-4999 points
- **Platinum**: 5000-9999 points
- **Diamond**: 10000+ points

## 🎁 Reward Categories

### Religious Items
- Coconuts
- Flowers (marigold, lotus)
- Prasad items
- Incense sticks

### Eco-Friendly Products
- Reusable bags
- Bamboo products
- Organic soaps
- Plant saplings

### Experience Rewards
- Special darshan passes
- Cultural event tickets
- Guided tours

### Vouchers
- Food court vouchers
- Transportation vouchers
- Accommodation discounts

## 🌍 Environmental Impact

### Tracking Metrics
- CO₂ emissions saved
- Water conservation
- Trees equivalent saved
- Waste diverted from landfills

### Reporting
- Real-time impact dashboard
- Monthly environmental reports
- User-specific impact tracking
- Community achievements

## 🔒 Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure file upload handling
- CORS configuration
- Environment variable protection

## 📱 Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized images and assets
- Offline capability (planned)
- PWA support (planned)

## 🚀 Deployment

### Backend Deployment (Render)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy from main branch

### Frontend Deployment (Vercel)
1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy from main branch

### Database (MongoDB Atlas)
1. Create cluster
2. Configure network access
3. Create database user
4. Get connection string

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- Simhastha 2028 organizing committee
- Environmental partners and sponsors
- Open source community
- All contributors and testers

---

**Built with ❤️ for a cleaner, greener Simhastha 2028** 🌱
