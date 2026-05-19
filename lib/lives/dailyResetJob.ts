import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Task from '@/models/Task';
import LifeHistory from '@/models/LifeHistory';
import connectDB from '@/lib/db';
import { getIstDate, getResetLivesValue } from './utils';
import { sendCheckOutEmail } from '@/lib/email';

/**
 * Automatically checks out staff members who forgot to check out from previous days.
 * 1. Finds all records with status 'checked-in' and date strictly before today's IST start.
 * 2. Processes pending life deductions up to 12:00 AM IST of the next day.
 * 3. Stops any running task timers.
 * 4. Checks out the user at exactly 12:00 AM IST.
 */
export async function performAutoCheckout(): Promise<{
  processed: number;
  errors: number;
}> {
  const result = { processed: 0, errors: 0 };
  try {
    await connectDB();
    const istNow = getIstDate();
    const todayIst = new Date(istNow);
    todayIst.setUTCHours(0, 0, 0, 0);

    // Find all records that are 'checked-in' from a previous day (date < todayIst)
    const activeRecords = await Attendance.find({
      status: 'checked-in',
      date: { $lt: todayIst }
    }).populate('userId', 'name email');

    for (const record of activeRecords) {
      try {
        // Calculate the exact 12:00 AM IST of the day following record.date
        // record.date is UTC midnight. 18.5 hours later is 12:00 AM IST.
        const autoCheckoutTime = new Date(record.date.getTime() + 18.5 * 60 * 60 * 1000);

        // Deduct lives for inactivity up to autoCheckoutTime
        let referenceTime = record.lastReplyAt || record.lastDeductionAt || record.checkInTime || record.createdAt;
        
        while (referenceTime && record.lives > 0) {
          const nextDeductionTime = new Date(new Date(referenceTime).getTime() + 30 * 60 * 1000);
          
          // Stop deductions if we reached the break start time (since they are/were on break)
          if (record.isOnBreak && record.currentBreakStart && nextDeductionTime > record.currentBreakStart) {
            break;
          }

          if (nextDeductionTime <= autoCheckoutTime) {
            // Deduct 0.5 life
            const previousLives = record.lives;
            const newLives = Math.max(0, previousLives - 0.5);
            record.lives = newLives;
            record.lastDeductionAt = nextDeductionTime;
            record.isHalfDay = newLives <= 2;

            // Create life history record
            await LifeHistory.create({
              userId: record.userId._id || record.userId,
              attendanceId: record._id,
              date: record.date,
              action: 'deduct',
              amount: 0.5,
              reason: '0.5 life reduced because no reply was received within 30 minutes.',
              previousLives,
              newLives,
              timestamp: nextDeductionTime,
              lastReplyAt: referenceTime,
              expectedDurationMinutes: 30,
            });

            referenceTime = nextDeductionTime;
          } else {
            break;
          }
        }

        // If on break, end it at the autoCheckoutTime
        if (record.isOnBreak && record.currentBreakStart) {
          const breakEndTime = record.currentBreakStart > autoCheckoutTime ? record.currentBreakStart : autoCheckoutTime;
          record.breakHistory.push({
            breakStartTime: record.currentBreakStart,
            breakEndTime: breakEndTime
          });
          record.isOnBreak = false;
          record.currentBreakStart = undefined;
        }
        record.remainingCountdownSeconds = 0;

        // Automatically check out
        record.status = 'checked-out';
        record.checkOutTime = autoCheckoutTime;
        
        await record.save();

        // Close any pending LifeHistory logs (stops "Ongoing" in UI)
        const pendingLogs = await LifeHistory.find({
          userId: record.userId._id || record.userId,
          date: record.date,
          action: 'deduct',
          $or: [
            { nextReplyAt: null },
            { nextReplyAt: { $exists: false } }
          ]
        });

        for (const log of pendingLogs) {
          const lastReplyTime = log.lastReplyAt || log.timestamp || record.createdAt;
          let delayMs = autoCheckoutTime.getTime() - new Date(lastReplyTime).getTime();
          if (delayMs < 0) delayMs = 0;
          const delayMinutes = Math.round(delayMs / (60 * 1000));

          log.nextReplyAt = autoCheckoutTime;
          log.delayMinutes = delayMinutes;
          await log.save();
        }

        // Stop all running task timers for this user
        const runningTasks = await Task.find({
          assignedTo: record.userId._id || record.userId,
          isTimerRunning: true,
        });

        for (const runningTask of runningTasks) {
          if (runningTask.timerStartedAt) {
            // Cap session seconds to autoCheckoutTime
            const stopTime = runningTask.timerStartedAt > autoCheckoutTime ? runningTask.timerStartedAt : autoCheckoutTime;
            const sessionSeconds = Math.floor((stopTime.getTime() - runningTask.timerStartedAt.getTime()) / 1000);
            runningTask.isTimerRunning = false;
            runningTask.totalTimeSpent += sessionSeconds;
            runningTask.timerStartedAt = undefined;
            await runningTask.save();
            console.log(`[Auto Checkout] Stopped task timer for ${runningTask._id} at ${autoCheckoutTime.toISOString()}`);
          }
        }

        // Send check-out email
        const staffName = (record.userId as any)?.name || 'Staff Member';
        await sendCheckOutEmail(staffName + ' (Auto-Checkout)', autoCheckoutTime).catch(err => console.error('Failed to send check-out email:', err));

        console.log(`[Auto Checkout] Automatically checked out user ${record.userId._id || record.userId} for date ${record.date.toISOString()} at ${autoCheckoutTime.toISOString()}`);
        result.processed++;
      } catch (err) {
        console.error(`[Auto Checkout] Error finalizing record for user ${record.userId._id || record.userId}:`, err);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('[Auto Checkout] Fatal error in performAutoCheckout:', error);
  }
  return result;
}

/**
 * Process the daily reset job at 12:00 AM IST
 * 1. Find all 'checked-in' staff and auto 'check-out' them for the previous day
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
    const checkoutResult = await performAutoCheckout();
    result.processed = checkoutResult.processed;
    result.errors = checkoutResult.errors;

    // 2. Reset User model lives (this will be used as default for the new day's check-in)
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
