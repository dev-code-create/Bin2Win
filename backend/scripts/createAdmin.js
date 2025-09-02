#!/usr/bin/env node

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import Database from '../config/database.js';

// Admin seed data
const adminSeeds = [
  {
    username: 'admin',
    email: 'admin@bin2win.com',
    password: 'admin123',
    fullName: 'Administrator',
    phoneNumber: '+919876543210',
    role: 'super_admin',
    permissions: [],
    profile: {
      bio: 'System Administrator',
      department: 'IT Administration',
      employeeId: 'ADM-000'
    }
  },
  {
    username: 'superadmin',
    email: 'superadmin@bin2win.com',
    password: 'Admin@123456',
    fullName: 'Super Administrator',
    phoneNumber: '+91-9876543210',
    role: 'super_admin',
    permissions: [], // Super admin gets all permissions automatically
    profile: {
      bio: 'System Super Administrator',
      department: 'IT Administration',
      employeeId: 'ADM-001'
    },
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        browser: true,
        mobile: false
      },
      dashboard: {
        defaultView: 'overview',
        refreshInterval: 30
      }
    }
  },
  {
    username: 'admin',
    email: 'admin.manager@bin2win.com',
    password: 'Admin@123456',
    fullName: 'Admin Manager',
    phoneNumber: '+91-9876543211',
    role: 'admin',
    permissions: [
      { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'booths', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'waste', actions: ['read', 'update', 'approve', 'reject'] },
      { module: 'rewards', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'transactions', actions: ['read', 'update'] },
      { module: 'analytics', actions: ['read'] }
    ],
    profile: {
      bio: 'General Administrator',
      department: 'Operations',
      employeeId: 'ADM-002'
    }
  },
  {
    username: 'booth_operator',
    email: 'booth.operator@bin2win.com',
    password: 'Booth@123456',
    fullName: 'Booth Operator',
    phoneNumber: '+91-9876543212',
    role: 'booth_operator',
    permissions: [
      { module: 'waste', actions: ['create', 'read', 'update'] },
      { module: 'users', actions: ['read'] },
      { module: 'booths', actions: ['read', 'update'] }
    ],
    profile: {
      bio: 'Collection Booth Operator',
      department: 'Field Operations',
      employeeId: 'BOP-001'
    }
  },
  {
    username: 'moderator',
    email: 'moderator@bin2win.com',
    password: 'Moderator@123456',
    fullName: 'Content Moderator',
    phoneNumber: '+91-9876543213',
    role: 'moderator',
    permissions: [
      { module: 'waste', actions: ['read', 'approve', 'reject'] },
      { module: 'users', actions: ['read', 'update'] },
      { module: 'rewards', actions: ['read'] }
    ],
    profile: {
      bio: 'Content and Submission Moderator',
      department: 'Quality Control',
      employeeId: 'MOD-001'
    }
  },
  {
    username: 'viewer',
    email: 'viewer@bin2win.com',
    password: 'Viewer@123456',
    fullName: 'Analytics Viewer',
    phoneNumber: '+91-9876543214',
    role: 'viewer',
    permissions: [
      { module: 'analytics', actions: ['read'] },
      { module: 'users', actions: ['read'] },
      { module: 'booths', actions: ['read'] },
      { module: 'waste', actions: ['read'] },
      { module: 'rewards', actions: ['read'] }
    ],
    profile: {
      bio: 'Analytics and Reporting Viewer',
      department: 'Analytics',
      employeeId: 'VIW-001'
    }
  }
];

async function createAdmins() {
  try {
    console.log('🚀 Starting Admin Creation Process...\n');
    
    // Connect to database
    await Database.connect();
    console.log('✅ Connected to MongoDB\n');

    // Clear existing admins (optional - comment out in production)
    console.log('🗑️  Clearing existing admins...');
    await Admin.deleteMany({});
    console.log('✅ Existing admins cleared\n');

    console.log('👤 Creating admin accounts...\n');
    
    for (const adminData of adminSeeds) {
      try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
          $or: [
            { email: adminData.email },
            { username: adminData.username }
          ]
        });

        if (existingAdmin) {
          console.log(`⚠️  Admin with username "${adminData.username}" or email "${adminData.email}" already exists. Skipping...`);
          continue;
        }

        // Create new admin
        const admin = new Admin(adminData);
        await admin.save();
        
        console.log(`✅ Created ${adminData.role}: ${adminData.fullName}`);
        console.log(`   📧 Email: ${adminData.email}`);
        console.log(`   👤 Username: ${adminData.username}`);
        console.log(`   🔑 Password: ${adminData.password}`);
        console.log(`   🏷️  Role: ${adminData.role}`);
        console.log(`   📞 Phone: ${adminData.phoneNumber}\n`);
        
      } catch (error) {
        console.error(`❌ Failed to create admin ${adminData.username}:`, error.message);
      }
    }

    console.log('🎉 Admin creation process completed!\n');
    
    // Display login information
    console.log('=' .repeat(60));
    console.log('🔐 ADMIN LOGIN CREDENTIALS');
    console.log('=' .repeat(60));
    console.log('📍 Admin Login URL: http://localhost:3000/admin/login');
    console.log('🌐 API Endpoint: http://localhost:3001/api/auth/admin/login\n');
    
    adminSeeds.forEach(admin => {
      console.log(`👤 ${admin.role.toUpperCase()} LOGIN:`);
      console.log(`   Email/Username: ${admin.email} or ${admin.username}`);
      console.log(`   Password: ${admin.password}`);
      console.log(`   Full Name: ${admin.fullName}`);
      console.log(`   Role: ${admin.role}\n`);
    });
    
    console.log('=' .repeat(60));
    console.log('📝 NOTES:');
    console.log('• You can login with either email or username');
    console.log('• Change default passwords after first login');
    console.log('• Super Admin has all permissions automatically');
    console.log('• Each role has specific permission sets');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Error creating admins:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
    process.exit(0);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔐 Admin Creation Script

Usage: node createAdmin.js [options]

Options:
  --help, -h     Show this help message
  --roles        Show available admin roles
  --clear        Clear existing admins before creating new ones

Examples:
  node createAdmin.js              # Create all default admins
  node createAdmin.js --clear      # Clear existing and create new admins
  node createAdmin.js --roles      # Show available roles

Admin Roles:
  • super_admin    - Full system access
  • admin          - General administration
  • booth_operator - Booth operations
  • moderator      - Content moderation
  • viewer         - Read-only analytics
  `);
  process.exit(0);
}

if (args.includes('--roles')) {
  console.log(`
🏷️  Available Admin Roles:

1. 🦸 SUPER_ADMIN
   • Full system access
   • All permissions automatically granted
   • System configuration
   • User and admin management

2. 👨‍💼 ADMIN  
   • General administration
   • User management
   • Booth management
   • Reward management
   • Transaction oversight

3. 🏭 BOOTH_OPERATOR
   • Booth operations
   • Waste collection recording
   • User QR scanning
   • Basic booth management

4. 🛡️ MODERATOR
   • Content moderation
   • Submission review
   • User content approval/rejection
   • Quality control

5. 👁️ VIEWER
   • Read-only access
   • Analytics viewing
   • Report generation
   • Data observation
  `);
  process.exit(0);
}

// Run the script
createAdmins();
