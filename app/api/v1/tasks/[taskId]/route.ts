import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Attendance from '@/models/Attendance';
import { resetActivityTimer } from '@/lib/lives/deductionJob';
import { z } from 'zod';

/**
 * Task update validation schema
 */
const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['todo', 'in-progress', 'stuck', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

/**
 * Task reply validation schema
 */
const addReplySchema = z.object({
  content: z.string().min(1).max(1000),
});

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

/**
 * GET /api/v1/tasks/[taskId]
 * Get a specific task by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Check attendance status for staff
    if (session.user.role === 'staff') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const attendance = await Attendance.findOne({
        userId: session.user.id,
        date: today,
      });

      if (attendance && attendance.status === 'checked-out') {
        return NextResponse.json(
          { success: false, message: 'You have checked out for today. Your work is complete.', error: 'CHECKED_OUT' },
          { status: 403 }
        );
      }
    }

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .lean();

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Staff can only view their own tasks
    if (session.user.role === 'staff' && task.assignedTo._id.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task fetched successfully',
      data: {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        assignedBy: task.assignedBy,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        lockedAt: task.lockedAt,
        totalTimeSpent: task.totalTimeSpent,
        isTimerRunning: task.isTimerRunning,
        timeElapsed: task.isTimerRunning && task.timerStartedAt
          ? task.totalTimeSpent + Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000)
          : task.totalTimeSpent,
        replies: task.replies || [],
      },
    });
  } catch (error) {
    console.error('GET /api/v1/tasks/[taskId] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch task', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/tasks/[taskId]
 * Update a task
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateTaskSchema.safeParse(body);
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

    // Check attendance status for staff
    if (session.user.role === 'staff') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const attendance = await Attendance.findOne({
        userId: session.user.id,
        date: today,
      });

      if (attendance && attendance.status === 'checked-out') {
        return NextResponse.json(
          { success: false, message: 'You have checked out for today. Your work is complete.', error: 'CHECKED_OUT' },
          { status: 403 }
        );
      }
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'admin';
    const isAssignee = task.assignedTo.toString() === session.user.id;

    if (!isAdmin && !isAssignee) {
      return NextResponse.json(
        { success: false, message: 'Access denied', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Staff can only update status, admin can update everything
    const updates: Record<string, unknown> = {};
    
    if (isAdmin) {
      if (validationResult.data.title) updates.title = validationResult.data.title;
      if (validationResult.data.description) updates.description = validationResult.data.description;
      if (validationResult.data.priority) updates.priority = validationResult.data.priority;
    }

    if (validationResult.data.status) {
      // Check if task is already locked (Done) - cannot change from Done
      if (task.status === 'done' && validationResult.data.status !== 'done') {
        return NextResponse.json(
          { success: false, message: 'This task has been completed and cannot be changed.', error: 'TASK_LOCKED' },
          { status: 403 }
        );
      }

      updates.status = validationResult.data.status;
      
      // Set startedAt when status changes to in-progress
      if (validationResult.data.status === 'in-progress' && !task.startedAt) {
        updates.startedAt = new Date();
      }
      
      // Set completedAt and lockedAt when status changes to done
      if (validationResult.data.status === 'done' && !task.completedAt) {
        updates.completedAt = new Date();
        updates.lockedAt = new Date();
        // Record task completion to reset life deduction countdown
        await resetActivityTimer(session.user.id);
      }
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true }
    )
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: 'Task not found after update', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Convert to plain object for response
    const taskObj = updatedTask.toObject();

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: taskObj._id.toString(),
        title: taskObj.title,
        description: taskObj.description,
        status: taskObj.status,
        priority: taskObj.priority,
        assignedTo: taskObj.assignedTo,
        assignedBy: taskObj.assignedBy,
        createdAt: taskObj.createdAt,
        updatedAt: taskObj.updatedAt,
        startedAt: taskObj.startedAt,
        completedAt: taskObj.completedAt,
        totalTimeSpent: taskObj.totalTimeSpent,
        isTimerRunning: taskObj.isTimerRunning,
        timeElapsed: taskObj.isTimerRunning && taskObj.timerStartedAt
          ? taskObj.totalTimeSpent + Math.floor((Date.now() - new Date(taskObj.timerStartedAt).getTime()) / 1000)
          : taskObj.totalTimeSpent,
        replies: taskObj.replies || [],
      },
    });
  } catch (error) {
    console.error('PATCH /api/v1/tasks/[taskId] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update task', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/tasks/[taskId]/reply
 * Add a reply to a task
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = addReplySchema.safeParse(body);
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

    // Check attendance status for staff
    if (session.user.role === 'staff') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const attendance = await Attendance.findOne({
        userId: session.user.id,
        date: today,
      });

      if (attendance && attendance.status === 'checked-out') {
        return NextResponse.json(
          { success: false, message: 'You have checked out for today. Your work is complete.', error: 'CHECKED_OUT' },
          { status: 403 }
        );
      }
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only assignee can add replies
    if (task.assignedTo.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Only assignee can add replies', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Add reply
    task.replies.push({
      content: validationResult.data.content,
      createdAt: new Date(),
    });

    await task.save();

    // Record the task activity to reset life deduction countdown
    await resetActivityTimer(session.user.id);

    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: 'Task not found after saving reply', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Convert to plain object for response
    const taskObj = updatedTask.toObject();

    return NextResponse.json({
      success: true,
      message: 'Reply added successfully',
      data: {
        id: taskObj._id.toString(),
        title: taskObj.title,
        description: taskObj.description,
        status: taskObj.status,
        priority: taskObj.priority,
        assignedTo: taskObj.assignedTo,
        assignedBy: taskObj.assignedBy,
        createdAt: taskObj.createdAt,
        updatedAt: taskObj.updatedAt,
        totalTimeSpent: taskObj.totalTimeSpent,
        isTimerRunning: taskObj.isTimerRunning,
        timeElapsed: taskObj.isTimerRunning && taskObj.timerStartedAt
          ? taskObj.totalTimeSpent + Math.floor((Date.now() - new Date(taskObj.timerStartedAt).getTime()) / 1000)
          : taskObj.totalTimeSpent,
        replies: taskObj.replies || [],
      },
    });
  } catch (error) {
    console.error('POST /api/v1/tasks/[taskId] reply error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add reply', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
