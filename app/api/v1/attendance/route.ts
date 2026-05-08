import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import { z } from 'zod';

/**
 * Check-in validation schema
 */
const checkInSchema = z.object({
  notes: z.string().max(500).optional(),
});

/**
 * Check-out validation schema
 */
const checkOutSchema = z.object({
  notes: z.string().max(500).optional(),
});

/**
 * Break start validation schema
 */
const breakStartSchema = z.object({
  reason: z.string().max(200).optional(),
});

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

    // Find or create today's attendance record
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
          checkOutTime: null,
          totalWorkingHours: 0,
          formattedWorkingHours: '00:00:00',
          remainingTime: 4 * 60 * 60, // 4 hours in seconds
          formattedRemainingTime: '04:00:00',
          isOnBreak: false,
          breaks: [],
          notes: '',
        },
      });
    }

    // Calculate current working hours and remaining time
    const workingHours = attendance.status === 'checked-in' 
      ? (attendance as unknown as { getCurrentWorkingHours(): number }).getCurrentWorkingHours()
      : attendance.totalWorkingHours;
    
    const fourHoursInSeconds = 4 * 60 * 60;
    const remainingTime = Math.max(0, fourHoursInSeconds - workingHours);

    // Format times
    const formatTime = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return NextResponse.json({
      success: true,
      message: 'Attendance fetched successfully',
      data: {
        id: attendance._id.toString(),
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        totalWorkingHours: workingHours,
        formattedWorkingHours: formatTime(workingHours),
        remainingTime: remainingTime,
        formattedRemainingTime: formatTime(remainingTime),
        isOnBreak: (attendance as unknown as { isOnBreak(): boolean }).isOnBreak(),
        breaks: attendance.breaks || [],
        notes: attendance.notes || '',
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

    // Check if already checked in
    const existingAttendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    if (existingAttendance && existingAttendance.status === 'checked-in') {
      return NextResponse.json(
        { success: false, message: 'Already checked in for today', error: 'ALREADY_CHECKED_IN' },
        { status: 400 }
      );
    }

    if (existingAttendance && existingAttendance.status === 'checked-out') {
      return NextResponse.json(
        { success: false, message: 'Already checked out for today', error: 'ALREADY_CHECKED_OUT' },
        { status: 400 }
      );
    }

    let attendance;
    const now = new Date();

    if (existingAttendance) {
      // Update existing record
      existingAttendance.status = 'checked-in';
      existingAttendance.checkInTime = now;
      if (validationResult.data.notes) {
        existingAttendance.notes = validationResult.data.notes;
      }
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        userId: session.user.id,
        date: today,
        status: 'checked-in',
        checkInTime: now,
        totalWorkingHours: 0,
        breaks: [],
        notes: validationResult.data.notes || '',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Checked in successfully',
      data: {
        id: attendance._id.toString(),
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        totalWorkingHours: attendance.totalWorkingHours,
        formattedWorkingHours: '00:00:00',
        remainingTime: 4 * 60 * 60,
        formattedRemainingTime: '04:00:00',
        isOnBreak: false,
        breaks: attendance.breaks,
        notes: attendance.notes,
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

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'No check-in record found for today', error: 'NOT_CHECKED_IN' },
        { status: 400 }
      );
    }

    if (attendance.status === 'checked-out') {
      return NextResponse.json(
        { success: false, message: 'Already checked out for today', error: 'ALREADY_CHECKED_OUT' },
        { status: 400 }
      );
    }

    if (attendance.status !== 'checked-in') {
      return NextResponse.json(
        { success: false, message: 'Not checked in', error: 'NOT_CHECKED_IN' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Calculate total working hours
    let totalSeconds = Math.floor((now.getTime() - attendance.checkInTime!.getTime()) / 1000);
    
    // Subtract break durations
    for (const breakItem of attendance.breaks) {
      if (breakItem.endTime) {
        totalSeconds -= breakItem.duration;
      } else {
        // End ongoing breaks
        breakItem.endTime = now;
        breakItem.duration = Math.floor((now.getTime() - breakItem.startTime.getTime()) / 1000);
        totalSeconds -= breakItem.duration;
      }
    }

    // Update attendance record
    attendance.status = 'checked-out';
    attendance.checkOutTime = now;
    attendance.totalWorkingHours = Math.max(0, totalSeconds);
    if (validationResult.data.notes) {
      attendance.notes = attendance.notes 
        ? `${attendance.notes}\n${validationResult.data.notes}` 
        : validationResult.data.notes;
    }

    await attendance.save();

    // Format time
    const formatTime = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return NextResponse.json({
      success: true,
      message: 'Checked out successfully',
      data: {
        id: attendance._id.toString(),
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        totalWorkingHours: attendance.totalWorkingHours,
        formattedWorkingHours: formatTime(attendance.totalWorkingHours),
        breaks: attendance.breaks,
        notes: attendance.notes,
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
    const validationResult = breakStartSchema.safeParse(body);
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

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    if (!attendance || attendance.status !== 'checked-in') {
      return NextResponse.json(
        { success: false, message: 'Must be checked in to take a break', error: 'NOT_CHECKED_IN' },
        { status: 400 }
      );
    }

    const now = new Date();
    
    // Check if currently on break
    const ongoingBreakIndex = attendance.breaks.findIndex(b => !b.endTime);

    if (ongoingBreakIndex >= 0) {
      // End current break
      const breakItem = attendance.breaks[ongoingBreakIndex];
      breakItem.endTime = now;
      breakItem.duration = Math.floor((now.getTime() - breakItem.startTime.getTime()) / 1000);
      attendance.status = 'checked-in';
      
      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Break ended successfully',
        data: {
          id: attendance._id.toString(),
          status: attendance.status,
          breaks: attendance.breaks,
        },
      });
    } else {
      // Start new break
      attendance.breaks.push({
        startTime: now,
        duration: 0,
        reason: validationResult.data.reason || '',
      });
      attendance.status = 'on-break';
      
      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Break started successfully',
        data: {
          id: attendance._id.toString(),
          status: attendance.status,
          breaks: attendance.breaks,
        },
      });
    }
  } catch (error) {
    console.error('PUT /api/v1/attendance error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to manage break', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
