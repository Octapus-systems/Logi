import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import dotenv from 'dotenv';
import connectDB from '../lib/db';
import User from '../models/User';

// Load environment variables
dotenv.config();

/**
 * Seed script to add staff and admin users to MongoDB
 * This script creates users with hardcoded credentials
 */
async function seedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    const usersToCreate = [
      {
        email: 'Fathima@octapus.com',
        password: 'Fath@123',
        name: 'Fathima',
        role: 'staff',
        lives: 0,
        isActive: true,
      },
      {
        email: 'Admin@octapus.com',
        password: 'Admin@666',
        name: 'Admin',
        role: 'admin',
        lives: 0,
        isActive: true,
      },
      {
        email: 'octapos.systems@gmail.com',
        password: 'Admin@123',
        name: 'Admin Systems',
        role: 'admin',
        lives: 0,
        isActive: true,
      },
    ];

    for (const userData of usersToCreate) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log('User already exists:', existingUser.email);
        console.log('Skipping creation...\n');
        continue;
      }

      // Create new user
      const newUser = await User.create(userData);

      console.log(`${newUser.role} user created successfully:`);
      console.log('Email:', newUser.email);
      console.log('Name:', newUser.name);
      console.log('Role:', newUser.role);
      console.log('Password will be hashed automatically\n');
    }

    console.log('All users processed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
