import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
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

    // Find or create attendance record - no blocking, just record time
    let attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    const now = new Date();

    if (attendance) {
      // Update existing record - always allow re-checkin
      attendance.status = 'checked-in';
      attendance.checkInTime = now;
      attendance = await attendance.save();
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        userId: session.user.id,
        date: today,
        status: 'checked-in',
        checkInTime: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Checked in successfully',
      data: {
        id: attendance._id.toString(),
        status: attendance.status,
        checkInTime: attendance.checkInTime,
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

    // Find or create attendance record - no blocking, just record check-out time
    let attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    const now = new Date();

    if (!attendance) {
      // Create record if doesn't exist (edge case - checking out without checking in)
      attendance = await Attendance.create({
        userId: session.user.id,
        date: today,
        status: 'checked-out',
        checkOutTime: now,
      });
    } else {
      // Update existing record - always allow check-out
      attendance.status = 'checked-out';
      attendance.checkOutTime = now;
      attendance = await attendance.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Checked out successfully',
      data: {
        id: attendance._id.toString(),
        status: attendance.status,
        checkInTime: attendance.checkInTime,
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

