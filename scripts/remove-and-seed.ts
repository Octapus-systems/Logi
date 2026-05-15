import dotenv from 'dotenv';
import connectDB from '../lib/db';
import User from '../models/User';
import Task from '../models/Task';
import Attendance from '../models/Attendance';

dotenv.config();

async function manageUsers() {
  try {
    await connectDB();

    const usersToRemove = [
      'fathima@octapus.com',
      'shifana@octapus.com',
      'jishad@octapus.com',
      'ajaypeter@octapus.com'
    ];

    console.log('Finding users to remove...');
    for (const email of usersToRemove) {
      const user = await User.findOne({ email });
      if (user) {
        console.log(`Deleting user: ${email} (ID: ${user._id})`);
        // Optional: you can also delete associated tasks and attendance here
        // await Task.deleteMany({ assignedTo: user._id });
        // await Attendance.deleteMany({ user: user._id });
        await User.deleteOne({ _id: user._id });
      } else {
        console.log(`User not found: ${email}`);
      }
    }

    console.log('Seeding new user test@gmail.com...');
    const testUserExists = await User.findOne({ email: 'test@gmail.com' });
    if (!testUserExists) {
      await User.create({
        email: 'test@gmail.com',
        password: 'Test@123',
        name: 'Test User',
        role: 'staff',
        lives: 3,
        isActive: true,
      });
      console.log('Test user created successfully.');
    } else {
      console.log('Test user already exists.');
    }

    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

manageUsers();
