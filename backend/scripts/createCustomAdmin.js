#!/usr/bin/env node

import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Database from "../config/database.js";

// Custom admin data with valid phone number format
const customAdmin = {
  username: "simhastha_admin",
  email: "admin@simhastha2028.org",
  password: "Simhastha@2028",
  fullName: "Simhastha 2028 Administrator",
  phoneNumber: "+919876543210", // Valid Indian phone number format
  role: "super_admin",
  permissions: [], // Super admin gets all permissions automatically
  profile: {
    bio: "Simhastha 2028 Clean & Green Project Administrator",
    department: "Project Management",
    employeeId: "SIM-2028-001",
    joiningDate: new Date("2024-01-01"),
    address: {
      street: "Simhastha Project Office",
      city: "Ujjain",
      state: "Madhya Pradesh",
      pincode: "456001",
    },
  },
  preferences: {
    theme: "light",
    language: "en",
    notifications: {
      email: true,
      sms: false,
      inApp: true,
    },
    dashboard: {
      layout: "default",
      widgets: ["waste_stats", "user_activity", "booth_status"],
    },
  },
};

async function createCustomAdmin() {
  try {
    console.log("🚀 Starting Custom Admin Creation Process...\n");

    // Connect to database
    await Database.connect();
    console.log("✅ Connected to MongoDB\n");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: customAdmin.email }, { username: customAdmin.username }],
    });

    if (existingAdmin) {
      console.log(
        `⚠️  Admin with username "${customAdmin.username}" or email "${customAdmin.email}" already exists.`
      );
      console.log("📝 Updating existing admin...");

      // Update existing admin
      Object.assign(existingAdmin, customAdmin);
      await existingAdmin.save();

      console.log(`✅ Updated existing admin: ${customAdmin.fullName}`);
    } else {
      // Create new admin
      const admin = new Admin(customAdmin);
      await admin.save();

      console.log(`✅ Created new admin: ${customAdmin.fullName}`);
    }

    console.log(`   📧 Email: ${customAdmin.email}`);
    console.log(`   👤 Username: ${customAdmin.username}`);
    console.log(`   🔑 Password: ${customAdmin.password}`);
    console.log(`   🏷️  Role: ${customAdmin.role}`);
    console.log(`   📞 Phone: ${customAdmin.phoneNumber}`);
    console.log(`   🏢 Department: ${customAdmin.profile.department}`);
    console.log(`   🆔 Employee ID: ${customAdmin.profile.employeeId}\n`);

    console.log("🎉 Custom admin creation completed!\n");

    // Display login information
    console.log("=".repeat(60));
    console.log("🔐 CUSTOM ADMIN LOGIN CREDENTIALS");
    console.log("=".repeat(60));
    console.log("📍 Admin Login URL: http://localhost:3000/admin/login");
    console.log(
      "🌐 API Endpoint: http://localhost:3001/api/auth/admin/login\n"
    );

    console.log(`👤 ${customAdmin.role.toUpperCase()} LOGIN:`);
    console.log(
      `   Email/Username: ${customAdmin.email} or ${customAdmin.username}`
    );
    console.log(`   Password: ${customAdmin.password}`);
    console.log(`   Full Name: ${customAdmin.fullName}`);
    console.log(`   Role: ${customAdmin.role}`);
    console.log(`   Department: ${customAdmin.profile.department}\n`);

    console.log("=".repeat(60));
    console.log("📝 IMPORTANT SECURITY NOTES:");
    console.log("• Change this password immediately after first login");
    console.log("• Super Admin has full system access");
    console.log("• Keep these credentials secure");
    console.log("• This admin can create additional admin accounts");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error creating custom admin:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\n🔐 Database connection closed");
    process.exit(0);
  }
}

// Run the script
createCustomAdmin();
