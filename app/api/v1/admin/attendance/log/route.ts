import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Task from "@/models/Task";
import User from "@/models/User";

/**
 * GET /api/v1/admin/attendance/log
 * Fetch attendance log for a specific staff member and date
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const dateStr = searchParams.get("date"); // Expected in YYYY-MM-DD format

    if (!staffId || !dateStr) {
      return NextResponse.json(
        { success: false, message: "Missing staffId or date" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    // Fetch User
    const staff = await User.findById(staffId).select("name email");
    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Staff member not found" },
        { status: 404 }
      );
    }

    // Fetch Attendance
    const attendance = await Attendance.findOne({
      userId: staffId,
      date: date,
    }).lean();

    // Fetch Tasks completed on this day
    // We use lockedAt or completedAt. The prompt says "marked as done".
    // In models/Task.ts, lockedAt is the timestamp when task was marked as Done.
    const tasks = await Task.find({
      assignedTo: staffId,
      status: "done",
      lockedAt: { $gte: date, $lt: nextDate },
    }).sort({ lockedAt: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: {
        staffName: staff.name,
        date: dateStr,
        lives: attendance?.lives || 0,
        totalTasksCleared: tasks.length,
        tasks: tasks.map(t => ({
          id: t._id,
          title: t.title,
          completedAt: t.lockedAt || t.completedAt,
          totalTimeSpent: t.totalTimeSpent || 0,
          replies: t.replies || [],
        })),
        attendanceStatus: attendance?.status || 'absent',
        checkInTime: attendance?.checkInTime,
        checkOutTime: attendance?.checkOutTime,
        isReCheckedIn: attendance?.isReCheckedIn || false,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance log:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
