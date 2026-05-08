import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import LifeHistory from '@/models/LifeHistory';
import { z } from 'zod';

/**
 * Admin life adjustment validation schema
 */
const adjustLivesSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  action: z.enum(['give', 'remove']),
  amount: z.number().int().min(1).max(4).default(1),
  reason: z.string().min(1).max(500),
});

/**
 * Get today's date at midnight for consistent querying
 */
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * POST /api/v1/lives/admin
 * Admin-only endpoint to give or remove lives from a staff member
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Only admin can adjust lives
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admin can adjust lives', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = adjustLivesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          error: 'VALIDATION_ERROR',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { userId, action, amount, reason } = validationResult.data;

    await connectDB();
    const today = getToday();

    // Find the user's attendance record for today
    const attendance = await Attendance.findOne({
      userId,
      date: today,
      status: 'checked-in',
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Staff member is not checked in today', error: 'NOT_CHECKED_IN' },
        { status: 400 }
      );
    }

    const previousLives = attendance.lives;
    let newLives: number;

    if (action === 'give') {
      // Give lives (add)
      newLives = Math.min(4, attendance.lives + amount);
    } else {
      // Remove lives (subtract)
      newLives = Math.max(0, attendance.lives - amount);
    }

    // Only proceed if there's an actual change
    if (newLives === previousLives) {
      return NextResponse.json(
        { 
          success: false, 
          message: action === 'give' 
            ? 'Lives already at maximum' 
            : 'Lives already at minimum', 
          error: 'NO_CHANGE' 
        },
        { status: 400 }
      );
    }

    // Update attendance record
    attendance.lives = newLives;
    attendance.isHalfDay = newLives <= 2;
    await attendance.save();

    // Create life history record
    const lifeHistory = await LifeHistory.create({
      userId,
      attendanceId: attendance._id,
      date: today,
      action: action === 'give' ? 'admin_restore' : 'admin_deduct',
      amount: Math.abs(newLives - previousLives),
      reason,
      previousLives,
      newLives,
      adminId: session.user.id,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'give' ? 'gave' : 'removed'} lives`,
      data: {
        userId,
        previousLives,
        newLives,
        isHalfDay: attendance.isHalfDay,
        historyId: lifeHistory._id.toString(),
      },
    });
  } catch (error) {
    console.error('POST /api/v1/lives/admin error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to adjust lives', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
