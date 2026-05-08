import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import dotenv from 'dotenv';
import connectDB from '../lib/db';
import Task from '../models/Task';
import User from '../models/User';

// Load environment variables
dotenv.config();

/**
 * Seed script to add sample tasks to MongoDB
 * This script creates sample tasks assigned to staff users
 */
async function seedTasks() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Find staff user to assign tasks to
    const staffUser = await User.findOne({ role: 'staff', isActive: true });
    const adminUser = await User.findOne({ role: 'admin', isActive: true });

    if (!staffUser || !adminUser) {
      console.log('No staff or admin users found. Please run seed-user.ts first.');
      process.exit(1);
    }

    const tasksToCreate = [
      {
        title: 'Update Dashboard UI',
        description: 'Redesign the admin dashboard with modern UI components and improve user experience.',
        priority: 'high',
        assignedTo: staffUser._id,
        assignedBy: adminUser._id,
        status: 'in-progress',
        totalTimeSpent: 3600, // 1 hour in seconds
        isTimerRunning: true,
        timerStartedAt: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
        replies: [
          {
            content: 'Started working on the dashboard redesign. Currently implementing the new stats cards.',
            createdAt: new Date(Date.now() - 30 * 60 * 1000),
          },
          {
            content: 'Made good progress on the responsive design. Need to finalize the color scheme.',
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Fix Authentication Bug',
        description: 'Users are reporting login issues when using special characters in passwords.',
        priority: 'urgent',
        assignedTo: staffUser._id,
        assignedBy: adminUser._id,
        status: 'todo',
        totalTimeSpent: 0,
        isTimerRunning: false,
        replies: [],
      },
      {
        title: 'Database Optimization',
        description: 'Optimize database queries for better performance on large datasets.',
        priority: 'medium',
        assignedTo: staffUser._id,
        assignedBy: adminUser._id,
        status: 'done',
        totalTimeSpent: 7200, // 2 hours in seconds
        isTimerRunning: false,
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Completed yesterday
        replies: [
          {
            content: 'Added proper indexes to frequently queried fields.',
            createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          },
          {
            content: 'Optimized the user lookup queries. Performance improved by 40%.',
            createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
          },
          {
            content: 'Task completed successfully. All database queries are now optimized.',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Mobile App Development',
        description: 'Develop a mobile companion app for the task management system.',
        priority: 'low',
        assignedTo: staffUser._id,
        assignedBy: adminUser._id,
        status: 'stuck',
        totalTimeSpent: 1800, // 30 minutes in seconds
        isTimerRunning: false,
        replies: [
          {
            content: 'Created basic wireframes for the mobile app interface.',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
      },
    ];

    for (const taskData of tasksToCreate) {
      // Check if task with similar title already exists
      const existingTask = await Task.findOne({ title: taskData.title });

      if (existingTask) {
        console.log('Task already exists:', existingTask.title);
        console.log('Skipping creation...\n');
        continue;
      }

      // Create new task
      const newTask = await Task.create(taskData);

      console.log(`Task created successfully:`);
      console.log('Title:', newTask.title);
      console.log('Status:', newTask.status);
      console.log('Priority:', newTask.priority);
      console.log('Assigned to:', staffUser.name);
      console.log('Replies:', newTask.replies.length);
      console.log('');
    }

    console.log('All tasks processed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tasks:', error);
    process.exit(1);
  }
}

seedTasks();
