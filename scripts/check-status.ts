import dotenv from 'dotenv';
import connectDB from '../lib/db';
import Attendance from '../models/Attendance';
import User from '../models/User';
import { getToday } from '../lib/dateUtils';

dotenv.config();

async function checkStatus() {
  try {
    await connectDB();
    const today = getToday();
    console.log('Today date:', today);

    // Find staff user
    const user = await User.findOne({ role: 'staff' });
    if (!user) {
      console.log('No staff user found');
      process.exit(0);
    }
    console.log('Found staff user:', user.name, user.email, user._id);

    // Find attendance record
    const attendance = await Attendance.findOne({
      userId: user._id,
      date: today,
    });

    if (!attendance) {
      console.log('No attendance record found for today');
      process.exit(0);
    }

    console.log('Attendance values:');
    console.log({
      status: attendance.status,
      lives: attendance.lives,
      lastReplyAt: attendance.lastReplyAt,
      lastDeductionAt: attendance.lastDeductionAt,
      checkInTime: attendance.checkInTime,
      createdAt: attendance.createdAt,
      isOnBreak: attendance.isOnBreak,
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStatus();
