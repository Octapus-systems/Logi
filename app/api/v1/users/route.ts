import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required", error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Fetch all staff members (exclude password field)
    const staffMembers = await User.find({ role: "staff", isActive: true })
      .select("-password")
      .sort({ name: 1 });

    return NextResponse.json(
      {
        success: true,
        message: "Staff members fetched successfully",
        data: staffMembers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching staff members:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch staff members",
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
