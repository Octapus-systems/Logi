import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    await connectDB();

    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permissions - must be assigned to staff or admin
    const isAdmin = session.user.role === 'admin';
    const isAssignee = task.assignedTo.toString() === session.user.id;

    if (!isAdmin && !isAssignee) {
      return NextResponse.json(
        { success: false, message: 'Access denied', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Tasks that are done shouldn't be moved?
    if (task.status === 'done') {
      return NextResponse.json(
        { success: false, message: 'Completed tasks cannot be moved to today.', error: 'TASK_LOCKED' },
        { status: 403 }
      );
    }

    // Use native MongoDB driver to bypass Mongoose's strict immutability on createdAt
    await Task.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(taskId) },
      { $set: { createdAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Task moved to today successfully',
    });
  } catch (error) {
    console.error('POST /api/v1/tasks/[taskId]/move-to-today error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to move task', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
