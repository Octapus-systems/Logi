const mongoose = require('mongoose');
require('dotenv').config();

async function debugAttendance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Attendance = mongoose.model('Attendance', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      date: Date,
      status: String,
      checkInTime: Date,
      lastReplyAt: Date,
      lastDeductionAt: Date,
      lives: Number
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      date: today,
      status: 'checked-in'
    });

    if (!attendance) {
      console.log('No active attendance found for today');
      process.exit(0);
    }

    console.log('Attendance Record:', JSON.stringify(attendance, null, 2));

    const now = new Date();
    let referenceTime = attendance.lastReplyAt;
    if (attendance.lastDeductionAt && (!referenceTime || attendance.lastDeductionAt > referenceTime)) {
      referenceTime = attendance.lastDeductionAt;
    }
    if (attendance.checkInTime && (!referenceTime || attendance.checkInTime > referenceTime)) {
      referenceTime = attendance.checkInTime;
    }

    console.log('Reference Time:', referenceTime);
    
    if (referenceTime) {
      const nextDeductionTime = new Date(new Date(referenceTime).getTime() + 30 * 60 * 1000);
      const diffMs = nextDeductionTime.getTime() - now.getTime();
      const diffMinutes = diffMs / (60 * 1000);
      console.log('Minutes Until Deduction:', diffMinutes);
    } else {
      console.log('No reference time found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugAttendance();
