import User from '@/models/User';
import Attendance from '@/models/Attendance';
import connectDB from '@/lib/db';
import { getIstDate, getResetLivesValue } from './utils';

/**
 * Process the daily reset job at 12:00 AM IST
 * 1. Find all 'checked-in' staff and 'check-out' them for the previous day
 * 2. Reset lives for all staff (2 on May 01, 4 otherwise)
 * 3. Clear activity markers
 */
export async function processDailyReset(): Promise<{
  processed: number;
  reset: number;
  errors: number;
}> {
  const result = {
    processed: 0,
    reset: 0,
    errors: 0,
  };

  try {
    await connectDB();

    const istNow = getIstDate();
    const resetLivesValue = getResetLivesValue();

    console.log(`[DailyResetJob] Running reset for IST date: ${istNow.toISOString()}`);
    console.log(`[DailyResetJob] Reset lives value: ${resetLivesValue}`);

    // 1. Finalize all active attendance records for the day that just ended
    // We look for any record that is 'checked-in' and has a date < today (IST)
    const todayIst = new Date(istNow);
    todayIst.setUTCHours(0, 0, 0, 0);

    const activeRecords = await Attendance.find({
      status: 'checked-in',
      date: { $lt: todayIst }
    });

    for (const record of activeRecords) {
      try {
        // Automatically check out
        record.status = 'checked-out';
        record.checkOutTime = new Date(); // Use actual current time for checkout
        
        // If on break, end it
        if (record.isOnBreak && record.currentBreakStart) {
          record.breakHistory.push({
            breakStartTime: record.currentBreakStart,
            breakEndTime: new Date()
          });
          record.isOnBreak = false;
          record.currentBreakStart = undefined;
          record.remainingCountdownSeconds = 0;
        }
        
        await record.save();
        result.processed++;
      } catch (err) {
        console.error(`[DailyResetJob] Error finalizing record for user ${record.userId}:`, err);
        result.errors++;
      }
    }

    // 2. Reset User model lives (this will be used as default for the new day's check-in)
    // and clear global staff markers if any.
    const staffMembers = await User.find({ role: 'staff' });
    
    for (const staff of staffMembers) {
      try {
        staff.lives = resetLivesValue;
        // Ensure any other global state on User is reset if needed
        await staff.save();
        
        // We don't pre-create Attendance for the new day. 
        // Staff must check in manually, which will create a new Attendance record.
        
        result.reset++;
      } catch (err) {
        console.error(`[DailyResetJob] Error resetting lives for user ${staff._id}:`, err);
        result.errors++;
      }
    }

    return result;
  } catch (error) {
    console.error('[DailyResetJob] Fatal error:', error);
    throw error;
  }
}
