import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';

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

    // Fetch all attendance records for the user
    const attendanceHistory = await Attendance.find({
      userId: session.user.id,
    })
      .sort({ date: -1 })
      .select('date lives maxLives status isHalfDay')
      .lean();

    return NextResponse.json({
      success: true,
      data: attendanceHistory,
    });
  } catch (error) {
    console.error('GET /api/v1/attendance/history error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch attendance history', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
