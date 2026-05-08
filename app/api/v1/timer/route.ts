import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Attendance from '@/models/Attendance';
import { z } from 'zod';

/**
 * Timer action validation schema
 */
const timerSchema = z.object({
  taskId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID'),
  action: z.enum(['start', 'stop']),
});

/**
 * POST /api/v1/timer
 * Start or stop task timer
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

    // Only staff can use task timers
    if (session.user.role !== 'staff') {
      return NextResponse.json(
        { success: false, message: 'Only staff can use task timers', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = timerSchema.safeParse(body);
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

    const { taskId, action } = validationResult.data;

    // Find the task
    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify task is assigned to current user
    if (task.assignedTo.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Task not assigned to you', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check if user is checked in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      userId: session.user.id,
      date: today,
    });

    if (!attendance || attendance.status !== 'checked-in') {
      return NextResponse.json(
        { success: false, message: 'Must check in before starting task timer', error: 'NOT_CHECKED_IN' },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === 'start') {
      // Check if timer is already running
      if (task.isTimerRunning) {
        return NextResponse.json(
          { success: false, message: 'Timer is already running', error: 'TIMER_ALREADY_RUNNING' },
          { status: 400 }
        );
      }

      // Start timer - status is now manually controlled by user
      task.isTimerRunning = true;
      task.timerStartedAt = now;

      await task.save();

      return NextResponse.json({
        success: true,
        message: 'Timer started successfully',
        data: {
          taskId: task._id.toString(),
          isTimerRunning: task.isTimerRunning,
          timerStartedAt: task.timerStartedAt,
          status: task.status,
          totalTimeSpent: task.totalTimeSpent,
          currentElapsed: task.totalTimeSpent,
        },
      });

    } else if (action === 'stop') {
      console.log('[Timer API] Stopping timer for task:', taskId);
      console.log('[Timer API] Task state before:', {
        isTimerRunning: task.isTimerRunning,
        totalTimeSpent: task.totalTimeSpent,
        timerStartedAt: task.timerStartedAt
      });

      // Check if timer is running
      if (!task.isTimerRunning) {
        return NextResponse.json(
          { success: false, message: 'Timer is not running', error: 'TIMER_NOT_RUNNING' },
          { status: 400 }
        );
      }

      // Calculate elapsed time for this session
      const sessionSeconds = Math.floor((now.getTime() - task.timerStartedAt!.getTime()) / 1000);
      console.log('[Timer API] Session seconds calculated:', sessionSeconds);
      
      // Stop timer
      task.isTimerRunning = false;
      task.totalTimeSpent += sessionSeconds;
      task.timerStartedAt = undefined;

      console.log('[Timer API] Task state before save:', {
        isTimerRunning: task.isTimerRunning,
        totalTimeSpent: task.totalTimeSpent,
        timerStartedAt: task.timerStartedAt
      });

      try {
        await task.save();
        console.log('[Timer API] Task saved successfully');

        return NextResponse.json({
          success: true,
          message: 'Timer stopped successfully',
          data: {
            taskId: task._id.toString(),
            isTimerRunning: task.isTimerRunning,
            timerStartedAt: task.timerStartedAt,
            status: task.status,
            totalTimeSpent: task.totalTimeSpent,
            sessionTime: sessionSeconds,
            currentElapsed: task.totalTimeSpent,
          },
        });
      } catch (saveError) {
        console.error('[Timer API] Error saving task:', saveError);
        return NextResponse.json(
          { success: false, message: 'Failed to save timer state', error: 'SAVE_ERROR' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('POST /api/v1/timer error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to control timer', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/timer
 * Get timer status for a specific task
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

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: 'Task ID is required', error: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate task ID format
    if (!/^[0-9a-fA-F]{24}$/.test(taskId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID format', error: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the task
    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify task is assigned to current user (or admin can view any)
    if (session.user.role === 'staff' && task.assignedTo.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Task not assigned to you', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Calculate current elapsed time if timer is running
    let currentElapsed = task.totalTimeSpent;
    if (task.isTimerRunning && task.timerStartedAt) {
      const sessionSeconds = Math.floor((Date.now() - task.timerStartedAt.getTime()) / 1000);
      currentElapsed += sessionSeconds;
    }

    return NextResponse.json({
      success: true,
      message: 'Timer status fetched successfully',
      data: {
        taskId: task._id.toString(),
        isTimerRunning: task.isTimerRunning,
        timerStartedAt: task.timerStartedAt,
        status: task.status,
        totalTimeSpent: task.totalTimeSpent,
        currentElapsed: currentElapsed,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/timer error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch timer status', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
