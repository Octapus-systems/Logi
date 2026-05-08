import Attendance from '@/models/Attendance';
import LifeHistory from '@/models/LifeHistory';

/**
 * Get today's date at midnight for consistent querying
 */
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

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
  checkInTime: Date
): Date {
  let referenceTime = checkInTime;
  
  if (lastReplyAt) {
    const replyTime = new Date(lastReplyAt).getTime();
    if (replyTime > referenceTime.getTime()) {
      referenceTime = new Date(lastReplyAt);
    }
  }
  
  if (lastDeductionAt) {
    const deductionTime = new Date(lastDeductionAt).getTime();
    if (deductionTime > referenceTime.getTime()) {
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
 * 3. If no reply in 30 minutes, deduct 1 life
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
          new Date(checkInTime)
        );

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
          reason: 'No task reply within 30 minutes',
          previousLives,
          newLives,
          timestamp: new Date(),
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
 * Record a task reply to pause life deductions
 * This should be called whenever a staff member adds a reply to any task
 */
export async function recordTaskReply(userId: string): Promise<boolean> {
  try {
    const today = getToday();

    const attendance = await Attendance.findOne({
      userId,
      date: today,
      status: 'checked-in',
    });

    if (!attendance) {
      console.log(`[DeductionJob] No active check-in found for user ${userId}`);
      return false;
    }

    // Update last reply timestamp
    attendance.lastReplyAt = new Date();
    await attendance.save();

    console.log(`[DeductionJob] Recorded task reply for user ${userId}, deduction countdown reset`);
    return true;
  } catch (error) {
    console.error(`[DeductionJob] Error recording task reply for user ${userId}:`, error);
    return false;
  }
}

/**
 * Initialize lives when staff checks in
 */
export async function initializeLivesOnCheckIn(userId: string): Promise<boolean> {
  try {
    const today = getToday();

    let attendance = await Attendance.findOne({
      userId,
      date: today,
    });

    const now = new Date();

    if (attendance) {
      // Reset lives on check-in
      attendance.lives = 4;
      attendance.lastReplyAt = now; // Start with fresh 30-minute window
      attendance.lastDeductionAt = undefined;
      attendance.isHalfDay = false;
      attendance.status = 'checked-in';
      attendance.checkInTime = now;
      await attendance.save();
    } else {
      // Create new attendance record with full lives
      attendance = await Attendance.create({
        userId,
        date: today,
        status: 'checked-in',
        checkInTime: now,
        lives: 4,
        lastReplyAt: now,
        lastDeductionAt: null,
        isHalfDay: false,
      });
    }

    // Record the initialization in history (optional - for audit)
    await LifeHistory.create({
      userId,
      attendanceId: attendance._id,
      date: today,
      action: 'restore',
      amount: 4,
      reason: 'Check-in: Lives reset to full',
      previousLives: 0,
      newLives: 4,
      timestamp: now,
    });

    return true;
  } catch (error) {
    console.error(`[DeductionJob] Error initializing lives for user ${userId}:`, error);
    return false;
  }
}
