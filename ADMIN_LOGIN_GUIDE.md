# 🔐 Admin Login & Authentication Guide

## 📋 **Overview**

The Bin2Win application uses a **dual authentication system**:
- **User Authentication**: For regular users (waste submitters)
- **Admin Authentication**: For administrators, booth operators, and moderators

## 🏗️ **System Architecture**

### **Models:**
- `User` - Regular application users
- `Admin` - Administrative users with roles and permissions

### **Authentication Types:**
- **User JWT Token**: `{ userId, type: 'user' }`
- **Admin JWT Token**: `{ adminId, type: 'admin', role: 'admin_role' }`

## 🚀 **Quick Start - Create Admin Users**

### **Step 1: Create Admin Accounts**

```bash
# Navigate to backend directory
cd backend

# Create admin accounts (includes all role types)
npm run create-admin

# Or run directly
node scripts/createAdmin.js
```

### **Step 2: Test Admin Login**

```bash
# Test admin login functionality
npm run test-admin

# Or run directly
node scripts/testAdminLogin.js
```

## 👤 **Default Admin Accounts**

After running the create-admin script, you'll have these accounts:

### **1. 🦸 Super Administrator**
- **Username**: `superadmin`
- **Email**: `admin@bin2win.com`
- **Password**: `Admin@123456`
- **Role**: `super_admin`
- **Permissions**: All permissions automatically

### **2. 👨‍💼 Admin Manager**
- **Username**: `admin`
- **Email**: `admin.manager@bin2win.com`
- **Password**: `Admin@123456`
- **Role**: `admin`
- **Permissions**: Users, Booths, Waste, Rewards, Transactions, Analytics

### **3. 🏭 Booth Operator**
- **Username**: `booth_operator`
- **Email**: `booth.operator@bin2win.com`
- **Password**: `Booth@123456`
- **Role**: `booth_operator`
- **Permissions**: Waste collection, User scanning, Booth management

### **4. 🛡️ Moderator**
- **Username**: `moderator`
- **Email**: `moderator@bin2win.com`
- **Password**: `Moderator@123456`
- **Role**: `moderator`
- **Permissions**: Content moderation, Submission review

### **5. 👁️ Analytics Viewer**
- **Username**: `viewer`
- **Email**: `viewer@bin2win.com`
- **Password**: `Viewer@123456`
- **Role**: `viewer`
- **Permissions**: Read-only analytics and reports

## 🌐 **How to Login**

### **Frontend Login:**

1. **Admin Panel Login**: http://localhost:3000/admin/login
2. **User Login**: http://localhost:3000/login

### **API Login:**

```javascript
// Admin Login API
POST http://localhost:3001/api/auth/admin/login
{
  "login": "superadmin",        // Can use username or email
  "password": "Admin@123456"
}

// User Login API  
POST http://localhost:3001/api/auth/login
{
  "phoneNumber": "+91-9876543210",
  "password": "user_password"
}
```

### **Login Response:**

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "admin": {
      "id": "...",
      "username": "superadmin",
      "email": "admin@bin2win.com",
      "fullName": "Super Administrator",
      "role": "super_admin",
      "permissions": [...],
      "lastLogin": "2024-01-21T...",
      "preferences": {...}
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 🔑 **Authentication Flow**

### **1. Admin Login Process:**
```
1. POST /api/auth/admin/login
2. Server validates credentials against Admin model
3. Returns JWT token with admin data
4. Frontend stores token and redirects to admin panel
5. Subsequent requests include Bearer token
```

### **2. Permission Checking:**
```javascript
// Middleware checks admin permissions
const hasPermission = admin.hasPermission('users', 'create');
if (!hasPermission) {
  return res.status(403).json({ message: 'Insufficient permissions' });
}
```

## 🛠️ **Admin Panel Features**

### **Super Admin Access:**
- ✅ User Management
- ✅ Admin User Management  
- ✅ Booth Management
- ✅ Waste Submission Management
- ✅ Rewards Management
- ✅ Analytics Dashboard
- ✅ System Settings
- ✅ Transaction Management

### **Regular Admin Access:**
- ✅ User Management
- ✅ Booth Management
- ✅ Waste Submission Review
- ✅ Rewards Management
- ✅ Analytics Viewing
- ❌ Admin User Management
- ❌ System Settings

### **Booth Operator Access:**
- ✅ QR Code Scanning
- ✅ Waste Collection Recording
- ✅ User Data Viewing
- ✅ Booth Status Updates
- ❌ User Management
- ❌ System Settings

## 🚨 **Security Features**

### **Login Protection:**
- **Account Locking**: 5 failed attempts lock account
- **Password Requirements**: 8+ characters with complexity
- **JWT Expiration**: Tokens expire after set time
- **Role-Based Access**: Permissions checked on every request

### **Best Practices:**
1. **Change Default Passwords**: After first login
2. **Use Strong Passwords**: Mix of letters, numbers, symbols
3. **Regular Token Refresh**: Implement token refresh mechanism
4. **Monitor Failed Logins**: Check for suspicious activity

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Admin not found"**
   ```bash
   # Solution: Create admin accounts first
   npm run create-admin
   ```

2. **"Invalid credentials"**
   - Check username/email and password
   - Ensure account is active (`isActive: true`)
   - Check if account is locked due to failed attempts

3. **"Insufficient permissions"**
   - Verify admin role and permissions
   - Check if accessing correct admin routes

4. **"Token expired"**
   - Re-login to get new token
   - Implement token refresh mechanism

### **Database Queries:**

```javascript
// Check admin accounts in MongoDB
db.admins.find({ isActive: true })

// Reset admin password
db.admins.updateOne(
  { username: "superadmin" },
  { $set: { password: "$2b$12$..." } } // Use bcrypt hashed password
)

// Check admin permissions
db.admins.findOne({ username: "admin" }).permissions
```

## 📚 **API Endpoints**

### **Admin Authentication:**
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/admin/logout` - Admin logout
- `GET /api/auth/admin/profile` - Get admin profile
- `PUT /api/auth/admin/profile` - Update admin profile

### **Admin Management:**
- `GET /api/admin/users` - List all users
- `GET /api/admin/booths` - List all booths  
- `GET /api/admin/submissions` - List waste submissions
- `GET /api/admin/analytics` - Get analytics data

## 🎯 **Next Steps**

1. **Run the create-admin script**
2. **Test login with provided credentials**
3. **Access admin panel at /admin/login**
4. **Change default passwords**
5. **Configure additional admin users as needed**

## 📞 **Support**

If you encounter issues:
1. Check server logs for errors
2. Verify MongoDB connection
3. Ensure all dependencies are installed
4. Check network connectivity to API endpoints

---

**🔐 Remember**: Always use strong passwords and change defaults in production!
