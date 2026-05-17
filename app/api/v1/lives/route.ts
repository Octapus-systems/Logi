import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getToday } from '@/lib/dateUtils';


function calculateMinutesUntilDeduction(
  lastReplyAt: Date | null,
  lastDeductionAt: Date | null,
  checkInTime: Date | null,
  createdAt: Date | null
): number | null {
  const now = new Date();
  
  // Determine the reference time (last reply or last deduction or check-in time)
  let referenceTime = lastReplyAt;
  
  if (lastDeductionAt && (!referenceTime || lastDeductionAt > referenceTime)) {
    referenceTime = lastDeductionAt;
  }
  
  if (checkInTime && (!referenceTime || checkInTime > referenceTime)) {
    referenceTime = checkInTime;
  }
  
  if (createdAt && (!referenceTime || createdAt > referenceTime)) {
    referenceTime = createdAt;
  }
  
  if (!referenceTime) {
    return null; // No activity yet, countdown not started
  }
  
  const nextDeductionTime = new Date(new Date(referenceTime).getTime() + 30 * 60 * 1000); // 30 minutes later
  const diffMs = nextDeductionTime.getTime() - now.getTime();
  const diffMinutes = diffMs / (60 * 1000);
  
  return diffMinutes > 0 ? diffMinutes : 0;
}

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

    // Staff view: return own lives status
    if (session.user.role === 'staff') {
      const attendance = await Attendance.findOne({
        userId: session.user.id,
        date: today,
      }).lean();

      if (!attendance || attendance.status !== 'checked-in') {
        return NextResponse.json({
          success: true,
          message: 'Not checked in',
          data: {
            lives: 0,
            maxLives: 4,
            isHalfDay: false,
            isCheckedIn: false,
            lastReplyAt: null,
            nextDeductionAt: null,
            minutesUntilDeduction: null,
          },
        });
      }

      const minutesUntilDeduction = calculateMinutesUntilDeduction(
        attendance.lastReplyAt ? new Date(attendance.lastReplyAt) : null,
        attendance.lastDeductionAt ? new Date(attendance.lastDeductionAt) : null,
        attendance.checkInTime ? new Date(attendance.checkInTime) : null,
        attendance.createdAt ? new Date(attendance.createdAt) : null
      );

      const nextDeductionAt = minutesUntilDeduction !== null
        ? new Date(Date.now() + minutesUntilDeduction * 60 * 1000).toISOString()
        : null;

      return NextResponse.json({
        success: true,
        message: 'Lives status fetched successfully',
        data: {
          lives: attendance.lives,
          maxLives: 4,
          isHalfDay: attendance.isHalfDay,
          isCheckedIn: true,
          isOnBreak: attendance.isOnBreak,
          lastReplyAt: attendance.lastReplyAt,
          lastDeductionAt: attendance.lastDeductionAt,
          nextDeductionAt,
          minutesUntilDeduction,
          remainingCountdownSeconds: attendance.remainingCountdownSeconds,
        },
      });
    }

    // Admin view: return all checked-in staff
    if (session.user.role === 'admin') {
      const checkedInStaff = await Attendance.find({
        date: today,
        status: 'checked-in',
      })
        .populate('userId', 'name email')
        .sort({ lives: 1, checkInTime: -1 })
        .lean();

      const formattedStaff = checkedInStaff.map((attendance) => {
        const user = attendance.userId as unknown as { name: string; email: string; _id: string };
        const minutesUntilDeduction = calculateMinutesUntilDeduction(
          attendance.lastReplyAt ? new Date(attendance.lastReplyAt) : null,
          attendance.lastDeductionAt ? new Date(attendance.lastDeductionAt) : null,
          attendance.checkInTime ? new Date(attendance.checkInTime) : null,
          attendance.createdAt ? new Date(attendance.createdAt) : null
        );

        return {
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          lives: attendance.lives,
          maxLives: 4,
          isHalfDay: attendance.isHalfDay,
          isOnBreak: attendance.isOnBreak,
          lastReplyAt: attendance.lastReplyAt,
          lastDeductionAt: attendance.lastDeductionAt,
          checkInTime: attendance.checkInTime,
          minutesUntilDeduction,
        };
      });

      return NextResponse.json({
        success: true,
        message: 'Staff lives status fetched successfully',
        data: formattedStaff,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid role', error: 'FORBIDDEN' },
      { status: 403 }
    );
  } catch (error) {
    console.error('GET /api/v1/lives error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch lives status', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
