# Simhastha 2028 Clean & Green Website - Development Instructions

## Project Overview

Develop a waste management incentive system for Simhastha 2028 that rewards devotees with Green Credit points for proper waste disposal, which can be redeemed for religious items and gifts. There will be user login and admin login two accounts

------🎯 Purpose

Encourage people to throw waste properly at collection booths.

Earn Green Credit points → redeem eco-friendly gifts (coconut, flowers, prasad).

Reduce litter, involve devotees, and keep the event eco-friendly & safe.

------💡 Concept Flow

Devotee ➝ Booth ➝ QR Scan ➝ Points ➝ Gifts ➝ Recycling

------📋 Detailed Approach

Devotee gives waste at booth.

Scan QR code. each user has a unique QR code which the Booth admin operator scans from admin account and fills how much weight does the weight measure and according to that a score of credit points are credited to the user account

Enter details (waste type, weight).

Points added to account.

Points redeemed for gifts.

Waste sent for recycling.

Recycling companies save cost.

------🌐 Website Key Features

User login/signup (OTP)

Waste submission form (type + quantity + QR)

Green Credit Wallet (points earned)

Reward Store (redeem gifts)

Booth Locator (Google Maps)

History of submissions/rewards

Admin panel (manage users, rewards, waste)

Sponsor Section (brand logos)

Mobile-friendly design

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: Bcrypt and hash
- **Hosting**: Vercel (Frontend) / Render (Backend)
- **QR Scanner**: HTML5 QR Code Scanner
- **Maps**: Google Maps API
- **Monitoring**: Firebase Logs + GitHub Actions
  -- Use import instead of require and javascript instead of typescript in the project

## Phase 1: Project Setup & Environment Configuration

### Step 1: Initialize Project Structure

```
simhastha-clean-green/
├── frontend/          # React.js application
├── backend/           # Node.js + Express API
├── admin-panel/       # Admin dashboard (React)
└── documentation/     # Project docs
```

### Step 2: Frontend Setup (React.js)

1. Create React app: `npx create-react-app frontend`
2. Install required dependencies:
   ```bash
   npm install firebase
   npm install react-router-dom
   npm install axios
   npm install html5-qrcode
   npm install @googlemaps/react-wrapper
   npm install react-bootstrap bootstrap
   npm install react-icons
   npm install react-toastify
   ```

### Step 3: Backend Setup (Node.js + Express)

1. Initialize backend: `npm init -y`
2. Install dependencies:
   ```bash
   npm install express mongoose cors dotenv
   npm install firebase-admin
   npm install multer
   npm install bcrypt jsonwebtoken
   npm install nodemailer
   npm install moment
   ```

### Step 4: Database Setup (MongoDB)

1. Create MongoDB Atlas account or local MongoDB setup
2. Create database: `simhastha_clean_green`
3. Required Collections:
   - `users` - User profiles and authentication
   - `waste_submissions` - Waste disposal records
   - `rewards` - Available rewards catalog
   - `transactions` - Points earning/spending history
   - `collection_booths` - Booth locations and details
   - `admins` - Admin user management
   - `sponsors` - Sponsor information

## Phase 2: Core Backend Development

### Step 5: Database Schema Design

#### Users Collection Schema:

```javascript
{
  _id: ObjectId,
  phoneNumber: String (unique),
  name: String,
  email: String (optional),
  greenCredits: Number (default: 0),
  totalWasteSubmitted: Number (default: 0),
  registrationDate: Date,
  lastActive: Date,
  isActive: Boolean (default: true)
}
```

#### Waste Submissions Schema:

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  boothId: ObjectId (ref: collection_booths),
  wasteType: String, // plastic, organic, paper, metal, etc.
  quantity: Number, // in kg
  pointsEarned: Number,
  submissionDate: Date,
  qrCode: String,
  status: String, // pending, approved, rejected
  photos: [String], // optional photo URLs
  verifiedBy: ObjectId (ref: admins) // optional
}
```

#### Collection Booths Schema:

```javascript
{
  _id: ObjectId,
  name: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  qrCode: String (unique),
  isActive: Boolean,
  capacity: Number, // max kg per day
  currentLoad: Number,
  operatingHours: {
    start: String,
    end: String
  },
  contactPerson: String,
  contactPhone: String
}
```

#### Rewards Schema:

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  pointsRequired: Number,
  category: String, // prasad, flowers, coconut, merchandise
  image: String,
  stock: Number,
  isActive: Boolean,
  sponsor: String // optional
}
```

#### Transactions Schema:

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  type: String, // earn, redeem
  points: Number,
  description: String,
  relatedId: ObjectId, // waste_submission_id or reward_id
  date: Date,
  status: String // completed, pending, cancelled
}
```

### Step 6: Authentication System (Firebase)

1. Set up Firebase project
2. Configure Firebase Auth for phone number verification
3. Create middleware for token verification
4. Implement OTP-based login/signup API endpoints:
   - `POST /api/auth/send-otp`
   - `POST /api/auth/verify-otp`
   - `POST /api/auth/refresh-token`

### Step 7: Core API Endpoints

#### User Management APIs:

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/credits` - Get user's green credits balance
- `GET /api/user/history` - Get user's submission history

#### Waste Submission APIs:

- `POST /api/waste/submit` - Submit waste disposal record
- `GET /api/waste/submissions` - Get user's submissions
- `PUT /api/waste/verify/:id` - Admin verification of submission
- `GET /api/waste/stats` - Get waste statistics

#### Collection Booth APIs:

- `GET /api/booths/nearby` - Get nearby booths (with lat/lng)
- `GET /api/booths/:id` - Get specific booth details
- `POST /api/booths/scan` - Validate QR code scan

#### Rewards APIs:

- `GET /api/rewards` - Get available rewards
- `POST /api/rewards/redeem` - Redeem points for reward
- `GET /api/rewards/history` - Get redemption history

## Phase 3: Frontend Development

### Step 8: React App Structure

```
frontend/src/
├── components/
│   ├── common/          # Reusable components
│   ├── auth/           # Login/Signup components
│   ├── waste/          # Waste submission components
│   ├── rewards/        # Reward store components
│   ├── maps/           # Map and location components
│   └── layout/         # Header, footer, navigation
├── pages/
│   ├── HomePage.js
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   ├── WasteSubmissionPage.js
│   ├── RewardStorePage.js
│   ├── BoothLocatorPage.js
│   ├── HistoryPage.js
│   └── ProfilePage.js
├── services/           # API calls
├── contexts/           # React context for state management
├── utils/              # Helper functions
└── assets/             # Images, icons
```

### Step 9: Key Frontend Components

#### Authentication Component:

- Phone number input with country code
- OTP verification interface
- Auto-login on successful verification

#### QR Scanner Component:

- HTML5 QR code scanner integration
- Booth validation
- Waste submission form trigger

#### Waste Submission Form:

- Waste type selection (dropdown)
- Quantity input (with validation)
- Photo upload (optional)
- Points calculation display
- Submission confirmation

#### Green Credits Wallet:

- Current balance display
- Recent transactions
- Points history with details

#### Booth Locator:

- Google Maps integration
- Current location detection
- Nearby booths with distance
- Booth details popup
- Directions integration

#### Reward Store:

- Reward categories filter
- Point requirement display
- Stock availability
- Redemption confirmation
- Success/failure notifications

### Step 10: Mobile Responsiveness

- Implement Bootstrap responsive grid system
- Optimize for touch interactions
- Ensure proper mobile viewport settings
- Test on various screen sizes (320px to 768px+)

## Phase 4: Admin Panel Development

### Step 11: Admin Dashboard Features

- User management (view, activate/deactivate)
- Waste submission verification system
- Booth management (add, edit, monitor)
- Reward catalog management
- Analytics and reporting dashboard
- Sponsor management section

### Step 12: Admin API Endpoints:

- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/submissions` - Pending verifications
- `POST /api/admin/booths` - Add new booth
- `PUT /api/admin/rewards/:id` - Update reward details

## Phase 5: Integration & Testing

### Step 13: Third-Party Integrations

#### Google Maps Setup:

1. Get Google Maps API key
2. Configure Maps JavaScript API
3. Enable Places API for location search
4. Implement geolocation services

#### Firebase Configuration:

1. Set up Firebase project
2. Configure authentication
3. Set up error logging
4. Configure push notifications (optional)

### Step 14: QR Code System

1. Generate unique QR codes for each booth
2. Implement QR validation on both frontend and backend
3. Handle invalid/expired QR codes
4. Create booth-specific QR scanning

### Step 15: Points & Rewards Logic

```javascript
// Points calculation example
const calculatePoints = (wasteType, quantity) => {
  const pointsPerKg = {
    plastic: 10,
    organic: 5,
    paper: 8,
    metal: 15,
    glass: 12,
  };
  return pointsPerKg[wasteType] * quantity;
};
```

## Phase 6: Security & Optimization

### Step 16: Security Implementation

- Input validation and sanitization
- Rate limiting for API endpoints
- CORS configuration
- Environment variables for sensitive data
- JWT token expiry handling
- SQL injection prevention (NoSQL injection)

### Step 17: Performance Optimization

- Image compression and optimization
- API response caching
- Database indexing
- Lazy loading for components
- Code splitting for React app

## Phase 7: Deployment

### Step 18: Frontend Deployment (Vercel)

1. Connect GitHub repository to Vercel
2. Configure build settings
3. Set environment variables
4. Custom domain setup (optional)

### Step 19: Backend Deployment (Render)

1. Create Render account
2. Deploy from GitHub repository
3. Configure environment variables
4. Database connection setup
5. Custom domain and SSL

### Step 20: Database Deployment

1. MongoDB Atlas cluster setup
2. Network access configuration
3. Database user creation
4. Connection string configuration

## Phase 8: Testing & Launch

### Step 21: Testing Checklist

- [ ] User registration and OTP verification
- [ ] QR code scanning functionality
- [ ] Waste submission and point calculation
- [ ] Reward redemption process
- [ ] Mobile responsiveness
- [ ] Admin panel functionality
- [ ] API endpoint testing
- [ ] Security vulnerability assessment
- [ ] Performance testing
- [ ] Cross-browser compatibility

### Step 22: Launch Preparation

- Content creation (rewards catalog)
- Booth setup and QR code generation
- User training materials
- Marketing materials
- Monitoring and analytics setup
- Backup and recovery procedures

## Additional Features (Phase 9 - Optional)

### Gamification Features:

- Leaderboards for top contributors
- Achievement badges
- Social sharing of contributions
- Team/group challenges

### Advanced Analytics:

- Waste collection heatmaps
- User engagement metrics
- Environmental impact calculator
- Sponsor ROI tracking

### Communication Features:

- Push notifications for rewards
- SMS updates for point balance
- Email newsletters
- In-app announcements

## Environment Variables Required

### Frontend (.env):

```
REACT_APP_API_BASE_URL=https://your-api-url.com
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Backend (.env):

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/simhastha_clean_green
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
JWT_SECRET=your-jwt-secret
PORT=3001
```

## Project Timeline Estimate

- **Phase 1-2 (Backend)**: 2-3 weeks
- **Phase 3 (Frontend)**: 3-4 weeks
- **Phase 4 (Admin Panel)**: 1-2 weeks
- **Phase 5-6 (Integration & Security)**: 1-2 weeks
- **Phase 7-8 (Deployment & Testing)**: 1 week
- **Total**: 8-12 weeks

## Support & Maintenance

- Regular database backups
- Security updates
- Performance monitoring
- User feedback implementation
- Feature enhancements based on usage

This comprehensive guide provides step-by-step instructions for developing the complete Simhastha 2028 Clean & Green website. Follow each phase sequentially for optimal results.
