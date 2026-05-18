import mongoose from 'mongoose';
import Attendance from '@/models/Attendance';
import LifeHistory from '@/models/LifeHistory';
import { getToday, getResetLivesValue } from './utils';

/**
 * Check if 30 minutes have passed since reference time
 */
function hasThirtyMinutesPassed(referenceTime: Date | null): boolean {
  if (!referenceTime) {
    return false;
  }
  
  const now = new Date();
  const thirtyMinutesInMs = 30 * 60 * 1000;
  return (now.getTime() - new Date(referenceTime).getTime()) >= thirtyMinutesInMs;
}

/**
 * Get the reference time for deduction calculation
 * This is the later of lastReplyAt or lastDeductionAt
 */
function getDeductionReferenceTime(
  lastReplyAt: Date | null | undefined,
  lastDeductionAt: Date | null | undefined,
  checkInTime: Date | null | undefined
): Date | null {
  let referenceTime: Date | null = checkInTime ? new Date(checkInTime) : null;
  
  if (lastReplyAt) {
    const replyTime = new Date(lastReplyAt).getTime();
    if (!referenceTime || replyTime > referenceTime.getTime()) {
      referenceTime = new Date(lastReplyAt);
    }
  }
  
  if (lastDeductionAt) {
    const deductionTime = new Date(lastDeductionAt).getTime();
    if (!referenceTime || deductionTime > referenceTime.getTime()) {
      referenceTime = new Date(lastDeductionAt);
    }
  }
  
  return referenceTime;
}

/**
 * Process life deductions for all checked-in staff
 * This function should be called by the cron job every minute
 * 
 * Logic:
 * 1. Find all staff with status 'checked-in' and lives > 0
 * 2. For each staff, check if 30 minutes have passed since last activity
 * 3. If no activity in 30 minutes, deduct 0.5 life
 * 4. Record the deduction in LifeHistory
 * 5. Update isHalfDay status if lives <= 2
 */
export async function processLifeDeductions(): Promise<{
  processed: number;
  deducted: number;
  errors: number;
  details: Array<{ userId: string; previousLives: number; newLives: number; reason: string }>;
}> {
  const result = {
    processed: 0,
    deducted: 0,
    errors: 0,
    details: [] as Array<{ userId: string; previousLives: number; newLives: number; reason: string }>,
  };

  try {
    const today = getToday();

    // Find all checked-in staff with lives remaining
    const checkedInStaff = await Attendance.find({
      date: today,
      status: 'checked-in',
      lives: { $gt: 0 },
    });

    result.processed = checkedInStaff.length;

    for (const attendance of checkedInStaff) {
      try {
        // Skip if staff is on break
        if (attendance.isOnBreak) {
          continue;
        }

        // Skip if check-in was less than 30 minutes ago (grace period)
        const checkInTime = attendance.checkInTime;
        if (!checkInTime) {
          continue;
        }

        const referenceTime = getDeductionReferenceTime(
          attendance.lastReplyAt || null,
          attendance.lastDeductionAt || null,
          attendance.checkInTime || attendance.createdAt
        );

        if (!referenceTime) {
          continue;
        }

        // Check if 30 minutes have passed since reference time
        if (!hasThirtyMinutesPassed(referenceTime)) {
          continue; // Still within grace period or has recent activity
        }

        // Deduct 0.5 life
        const previousLives = attendance.lives;
        const newLives = previousLives - 0.5;

        // Update attendance record
        attendance.lives = newLives;
        attendance.lastDeductionAt = new Date();
        attendance.isHalfDay = newLives <= 2;
        
        await attendance.save();

        // Create life history record
        await LifeHistory.create({
          userId: attendance.userId,
          attendanceId: attendance._id,
          date: today,
          action: 'deduct',
          amount: 0.5,
          reason: '0.5 life reduced because no reply was received within 30 minutes.',
          previousLives,
          newLives,
          timestamp: new Date(),
          lastReplyAt: referenceTime,
          expectedDurationMinutes: 30,
        });

        result.deducted++;
        result.details.push({
          userId: attendance.userId.toString(),
          previousLives,
          newLives,
          reason: newLives <= 2 ? 'HALF_DAY_THRESHOLD' : 'DEDUCTED',
        });

      } catch (error) {
        console.error(`[DeductionJob] Error processing deduction for user ${attendance.userId}:`, error);
        result.errors++;
      }
    }

    return result;
  } catch (error) {
    console.error('[DeductionJob] Fatal error in processLifeDeductions:', error);
    throw error;
  }
}

/**
 * Reset activity timer (pauses life deductions)
 * This should be called whenever a staff member does any task activity:
 * - Adding a reply to a task
 * - Changing task status to 'done'
 * - Starting/Stopping a task timer
 */
export async function resetActivityTimer(userId: string): Promise<boolean> {
  try {
    const today = getToday();
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    const attendance = await Attendance.findOne({
      userId: userObjectId,
      date: today,
      status: 'checked-in',
    });

    if (!attendance) {
      console.log(`[DeductionJob] No active check-in found for user ${userId}`);
      return false;
    }

    const now = new Date();
    const oldLastReplyAt = attendance.lastReplyAt;

    // Update last reply timestamp (used as reference for inactivity)
    attendance.lastReplyAt = now;
    await attendance.save();

    // Find any pending automatic life deduction logs for this user today and complete them
    const pendingLogs = await LifeHistory.find({
      userId: userObjectId,
      date: today,
      action: 'deduct',
      $or: [
        { nextReplyAt: null },
        { nextReplyAt: { $exists: false } }
      ]
    });

    for (const log of pendingLogs) {
      const lastReplyTime = log.lastReplyAt || oldLastReplyAt || log.createdAt;
      const delayMs = now.getTime() - new Date(lastReplyTime).getTime();
      const delayMinutes = Math.round(delayMs / (60 * 1000));

      log.nextReplyAt = now;
      log.delayMinutes = delayMinutes;
      await log.save();
    }

    console.log(`[DeductionJob] Reset activity timer and updated ${pendingLogs.length} pending life logs for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[DeductionJob] Error resetting activity timer for user ${userId}:`, error);
    return false;
  }
}

/**
 * Initialize lives when staff checks in
 */
export async function initializeLivesOnCheckIn(userId: string): Promise<boolean> {
  try {
    const today = getToday();
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    let attendance = await Attendance.findOne({
      userId: userObjectId,
      date: today,
    });

    const now = new Date();
    const resetLivesValue = getResetLivesValue();

    if (attendance) {
      // Reset lives on check-in
      attendance.lives = resetLivesValue;
      attendance.lastReplyAt = now; // Start with fresh 30-minute window
      attendance.lastDeductionAt = undefined;
      attendance.isHalfDay = false;
      attendance.status = 'checked-in';
      attendance.checkInTime = now;
      attendance.remainingCountdownSeconds = 0;
      attendance.currentBreakStart = undefined;
      attendance.isOnBreak = false;
      await attendance.save();
    } else {
      // Create new attendance record with full lives
      attendance = await Attendance.create({
        userId: userObjectId,
        date: today,
        status: 'checked-in',
        checkInTime: now,
        lives: resetLivesValue,
        lastReplyAt: now,
        lastDeductionAt: null,
        isHalfDay: false,
        remainingCountdownSeconds: 0,
        isOnBreak: false,
      });
    }

    // Record the initialization in history (optional - for audit)
    await LifeHistory.create({
      userId: userObjectId,
      attendanceId: attendance._id,
      date: today,
      action: 'restore',
      amount: resetLivesValue,
      reason: 'Check-in: Lives reset to full',
      previousLives: 0,
      newLives: resetLivesValue,
      timestamp: now,
    });

    return true;
  } catch (error) {
    console.error(`[DeductionJob] Error initializing lives for user ${userId}:`, error);
    return false;
  }
}
