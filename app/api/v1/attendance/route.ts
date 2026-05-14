import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import Task from '@/models/Task';
import { initializeLivesOnCheckIn } from '@/lib/lives/deductionJob';
import { sendCheckInEmail, sendCheckOutEmail } from '@/lib/email';
import { z } from 'zod';

/**
 * Simple check-in validation schema - accepts empty body
 */
const checkInSchema = z.object({}).passthrough();

/**
 * Simple check-out validation schema - accepts empty body
 */
const checkOutSchema = z.object({}).passthrough();


/**
 * Get today's date at midnight for consistent date querying
 */
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * GET /api/v1/attendance
 * Get today's attendance status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await connectDB();

    const today = getToday();

    // Find today's attendance record
    let attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    }).lean();

    if (!attendance) {
      // Return default state if no attendance record exists
      return NextResponse.json({
        success: true,
        message: 'No attendance record for today',
        data: {
          status: 'absent',
          checkInTime: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance fetched successfully',
      data: {
        id: attendance._id.toString(),
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        isOnBreak: attendance.isOnBreak,
        isReCheckedIn: attendance.isReCheckedIn || false,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/attendance error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch attendance', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/attendance
 * Check in for the day
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

    const body = await request.json();
    
    // Validate request body
    const validationResult = checkInSchema.safeParse(body);
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

    await connectDB();

    const today = getToday();
    const existingAttendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    if (existingAttendance && existingAttendance.status === 'checked-out') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'You have already checked out for today. Only an admin can re-check you in.', 
          error: 'ALREADY_CHECKED_OUT' 
        },
        { status: 403 }
      );
    }

    // Initialize lives on check-in using the dedicated function
    const initialized = await initializeLivesOnCheckIn(session.user.id);
    
    if (!initialized) {
      return NextResponse.json(
        { success: false, message: 'Failed to initialize lives', error: 'INITIALIZATION_ERROR' },
        { status: 500 }
      );
    }

    // Fetch the updated attendance record
    const attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch attendance record', error: 'NOT_FOUND' },
        { status: 500 }
      );
    }

    // Send check-in email asynchronously
    sendCheckInEmail(
      session.user.name || session.user.email || 'Staff Member',
      new Date()
    ).catch(err => console.error('Failed to send check-in email:', err));

    return NextResponse.json({
      success: true,
      message: 'Checked in successfully',
      data: {
        id: attendance._id.toString(),
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        lives: attendance.lives,
        maxLives: 4,
        isHalfDay: attendance.isHalfDay,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/attendance error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check in', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/attendance
 * Check out for the day
 * Rules:
 * 1. If on break, end the break first automatically
 * 2. Must have at least one task marked as Done to check out
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = checkOutSchema.safeParse(body);
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

    await connectDB();

    const today = getToday();
    const now = new Date();

    // Find attendance record
    let attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    if (!attendance || attendance.status !== 'checked-in') {
      return NextResponse.json(
        { success: false, message: 'Not checked in', error: 'NOT_CHECKED_IN' },
        { status: 400 }
      );
    }

    // Rule 1: If on break, end the break first automatically
    if (attendance.isOnBreak && attendance.currentBreakStart) {
      attendance.breakHistory.push({
        breakStartTime: attendance.currentBreakStart as Date,
        breakEndTime: now,
      });
      attendance.isOnBreak = false;
      attendance.currentBreakStart = undefined;
      // Keep remainingCountdownSeconds as it is (it was set when break started)
    } else {
      // If not on break, calculate and store the remaining seconds for resumption
      const referenceTime = attendance.lastReplyAt || attendance.lastDeductionAt || attendance.checkInTime || attendance.createdAt;
      if (referenceTime) {
        const thirtyMinutesInMs = 30 * 60 * 1000;
        const elapsedMs = now.getTime() - new Date(referenceTime).getTime();
        const remainingMs = Math.max(0, thirtyMinutesInMs - elapsedMs);
        attendance.remainingCountdownSeconds = Math.floor(remainingMs / 1000);
      }
    }

    // Update existing record - proceed with checkout
    attendance.status = 'checked-out';
    attendance.checkOutTime = now;
    attendance = await attendance.save();

    // Send check-out email asynchronously
    sendCheckOutEmail(
      session.user.name || session.user.email || 'Staff Member',
      now
    ).catch(err => console.error('Failed to send check-out email:', err));

    return NextResponse.json({
      success: true,
      message: 'Checked out successfully',
      data: {
        id: attendance._id.toString(),
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        isOnBreak: false,
      },
    });
  } catch (error) {
    console.error('PATCH /api/v1/attendance error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check out', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Break action validation schema
 */
const breakActionSchema = z.object({
  action: z.enum(['start', 'end']),
  remainingSeconds: z.number().min(0).optional(), // Required when ending break
});

/**
 * PUT /api/v1/attendance
 * Start or end a break
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = breakActionSchema.safeParse(body);
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

    await connectDB();

    const today = getToday();
    const now = new Date();

    // Find attendance record
    const attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    if (!attendance || attendance.status !== 'checked-in') {
      return NextResponse.json(
        { success: false, message: 'Not checked in', error: 'NOT_CHECKED_IN' },
        { status: 400 }
      );
    }

    const { action, remainingSeconds } = validationResult.data;

    if (action === 'start') {
      // Rule: Check if staff has at least one task marked as Done today
      const completedTaskCount = await Task.countDocuments({
        assignedTo: session.user.id,
        status: 'done',
        completedAt: { $gte: today },
      });

      if (completedTaskCount === 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'You must complete at least 1 task before taking a break.', 
            error: 'NO_COMPLETED_TASKS' 
          },
          { status: 403 }
        );
      }

      // Start break
      if (attendance.isOnBreak) {
        return NextResponse.json(
          { success: false, message: 'Already on break', error: 'ALREADY_ON_BREAK' },
          { status: 400 }
        );
      }

      attendance.isOnBreak = true;
      attendance.currentBreakStart = now;
      // Store remaining seconds for countdown resumption
      if (remainingSeconds !== undefined) {
        attendance.remainingCountdownSeconds = remainingSeconds;
      }

      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Break started',
        data: {
          isOnBreak: true,
          breakStartTime: now.toISOString(),
        },
      });
    } else {
      // End break
      if (!attendance.isOnBreak) {
        return NextResponse.json(
          { success: false, message: 'Not on break', error: 'NOT_ON_BREAK' },
          { status: 400 }
        );
      }

      // Add to break history
      if (attendance.currentBreakStart) {
        attendance.breakHistory.push({
          breakStartTime: attendance.currentBreakStart as Date,
          breakEndTime: now,
        });
      }

      attendance.isOnBreak = false;
      attendance.currentBreakStart = undefined;
      attendance.remainingCountdownSeconds = 0;

      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Break ended',
        data: {
          isOnBreak: false,
          breakEndTime: now.toISOString(),
          remainingCountdownSeconds: remainingSeconds || 0,
        },
      });
    }
  } catch (error) {
    console.error('PUT /api/v1/attendance error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process break action', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

