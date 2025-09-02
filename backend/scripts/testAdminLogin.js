#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

// Test admin credentials
const testCredentials = [
  {
    role: 'Super Admin',
    login: 'superadmin', // Can use username or email
    password: 'Admin@123456'
  },
  {
    role: 'Admin Manager',
    login: 'admin@bin2win.com', // Can use username or email
    password: 'Admin@123456'
  },
  {
    role: 'Booth Operator',
    login: 'booth_operator',
    password: 'Booth@123456'
  }
];

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login System\n');
  console.log('🌐 API Base URL:', BASE_URL);
  console.log('📍 Login Endpoint:', `${BASE_URL}/auth/admin/login\n`);

  for (const cred of testCredentials) {
    try {
      console.log(`👤 Testing ${cred.role} login...`);
      console.log(`   📧 Login: ${cred.login}`);
      console.log(`   🔑 Password: ${cred.password}`);
      
      const response = await axios.post(`${BASE_URL}/auth/admin/login`, {
        login: cred.login,
        password: cred.password
      });

      if (response.data.success) {
        const admin = response.data.data.admin;
        const token = response.data.data.token;
        
        console.log(`✅ Login successful!`);
        console.log(`   👤 Name: ${admin.fullName}`);
        console.log(`   🏷️  Role: ${admin.role}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   🔐 Token: ${token.substring(0, 20)}...`);
        console.log(`   🎯 Permissions: ${admin.permissions.length} modules\n`);
        
        // Test a protected admin route
        try {
          const protectedResponse = await axios.get(`${BASE_URL}/admin/dashboard`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log(`✅ Protected route access successful`);
        } catch (protectedError) {
          console.log(`⚠️  Protected route test failed:`, protectedError.response?.data?.message || protectedError.message);
        }
        
      } else {
        console.log(`❌ Login failed:`, response.data.message);
      }
      
    } catch (error) {
      console.log(`❌ Login error:`, error.response?.data?.message || error.message);
    }
    
    console.log('-'.repeat(50));
  }

  console.log('\n🎯 Frontend Login URLs:');
  console.log('Admin Panel: http://localhost:3000/admin/login');
  console.log('User Portal: http://localhost:3000/login\n');
  
  console.log('📝 How to login in frontend:');
  console.log('1. Go to http://localhost:3000/admin/login');
  console.log('2. Use any of the credentials above');
  console.log('3. You can use either email or username');
  console.log('4. After login, you\'ll be redirected to admin panel\n');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧪 Admin Login Test Script

Usage: node testAdminLogin.js [options]

Options:
  --help, -h     Show this help message

This script tests the admin login functionality by attempting to login
with different admin accounts and testing protected route access.

Prerequisites:
1. Backend server running on http://localhost:3001
2. Admin accounts created (run createAdmin.js first)
3. MongoDB connected and running

Test Accounts:
• superadmin / Admin@123456
• admin@bin2win.com / Admin@123456  
• booth_operator / Booth@123456
  `);
  process.exit(0);
}

testAdminLogin();
