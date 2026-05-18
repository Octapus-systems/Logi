import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Task from "@/models/Task";
import User from "@/models/User";
import LifeHistory from "@/models/LifeHistory";
import { performAutoCheckout } from "@/lib/lives/dailyResetJob";


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

    // Run auto checkout before querying logs to ensure accurate historical data
    try {
      await performAutoCheckout();
    } catch (err) {
      console.error('[Admin Attendance Log] Error running auto checkout:', err);
    }

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
    date.setUTCHours(0, 0, 0, 0);

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
    const tasks = await Task.find({
      assignedTo: staffId,
      status: "done",
      lockedAt: { $gte: date, $lt: nextDate },
    }).sort({ lockedAt: 1 }).lean();

    // Fetch Pending Tasks (not done) created on the selected date
    const pendingTasks = await Task.find({
      assignedTo: staffId,
      status: { $ne: "done" },
      createdAt: { $gte: date, $lt: nextDate },
    }).sort({ createdAt: -1 }).lean();

    // Fetch Life History for this user on this day
    const lifeHistory = await LifeHistory.find({
      userId: staffId,
      date: date,
    })
      .populate("adminId", "name")
      .sort({ timestamp: 1 })
      .lean();

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
        pendingTasks: pendingTasks.map(t => ({
          id: t._id,
          title: t.title,
          status: t.status,
          createdAt: t.createdAt,
          priority: t.priority,
          totalTimeSpent: t.totalTimeSpent || 0,
        })),
        lifeHistory: lifeHistory.map(lh => ({
          id: lh._id.toString(),
          action: lh.action,
          amount: lh.amount,
          reason: lh.reason,
          previousLives: lh.previousLives,
          newLives: lh.newLives,
          adminName: (lh.adminId as unknown as { name?: string })?.name || null,
          timestamp: lh.timestamp,
          lastReplyAt: lh.lastReplyAt,
          nextReplyAt: lh.nextReplyAt,
          delayMinutes: lh.delayMinutes,
          expectedDurationMinutes: lh.expectedDurationMinutes,
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
