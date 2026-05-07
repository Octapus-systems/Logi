import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import dotenv from 'dotenv';
import connectDB from '../lib/db';
import User from '../models/User';

// Load environment variables
dotenv.config();

/**
 * Seed script to add staff user to MongoDB
 * This script creates a staff user with hardcoded credentials
 */
async function seedUser() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'Fathima@octapus.com' });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      console.log('Skipping creation...');
      process.exit(0);
    }

    // Create new staff user
    const staffUser = await User.create({
      email: 'Fathima@octapus.com',
      password: 'Fath@123',
      name: 'Fathima',
      role: 'staff',
      lives: 0,
      isActive: true,
    });

    console.log('Staff user created successfully:');
    console.log('Email:', staffUser.email);
    console.log('Name:', staffUser.name);
    console.log('Role:', staffUser.role);
    console.log('Password will be hashed automatically');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
}

seedUser();
