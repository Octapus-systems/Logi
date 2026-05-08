import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import AuditLog from '@/models/AuditLog';
import { z } from 'zod';

const recheckinSchema = z.object({
  staffId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = recheckinSchema.safeParse(body);

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

    const { staffId, date: dateStr } = validationResult.data;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    await connectDB();

    // Find the attendance record
    const attendance = await Attendance.findOne({
      userId: staffId,
      date: date,
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (attendance.status !== 'checked-out') {
      return NextResponse.json(
        { success: false, message: 'Staff is not checked out', error: 'NOT_CHECKED_OUT' },
        { status: 400 }
      );
    }

    // Restore status to checked-in
    attendance.status = 'checked-in';
    attendance.checkOutTime = undefined;
    attendance.isReCheckedIn = true;

    // Resume timer: shift lastReplyAt so that current elapsed time matches what was stored
    // remainingCountdownSeconds stores the time that WAS REMAINING at checkout
    if (attendance.remainingCountdownSeconds > 0) {
      const thirtyMinutesInMs = 30 * 60 * 1000;
      const elapsedMs = Math.max(0, thirtyMinutesInMs - (attendance.remainingCountdownSeconds * 1000));
      attendance.lastReplyAt = new Date(Date.now() - elapsedMs);
      // Reset remainingCountdownSeconds as it's now incorporated into lastReplyAt
      attendance.remainingCountdownSeconds = 0;
    }
    
    await attendance.save();

    // Log the action
    await AuditLog.create({
      action: 'RE_CHECK_IN',
      adminId: session.user.id,
      targetUserId: staffId,
      details: {
        date: dateStr,
        previousStatus: 'checked-out',
        recheckinTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff re-checked in successfully',
      data: {
        status: attendance.status,
        isReCheckedIn: attendance.isReCheckedIn,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/admin/attendance/recheckin error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to re-check in', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
