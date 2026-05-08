import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import { z } from 'zod';

/**
 * Task creation validation schema
 */
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});

/**
 * GET /api/v1/tasks
 * Get tasks for the authenticated user (staff) or all tasks (admin)
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build query based on user role
    let query: Record<string, unknown> = {};
    
    if (session.user.role === 'staff') {
      query.assignedTo = session.user.id;
    } else if (session.user.role === 'admin') {
      // Admin can filter by assignedTo
      const assignedTo = searchParams.get('assignedTo');
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
    }

    // Filter by status if provided
    if (status && ['todo', 'in-progress', 'stuck', 'done'].includes(status)) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch tasks
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Task.countDocuments(query);

    // Format response
    const formattedTasks = tasks.map((task) => ({
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
      totalTimeSpent: task.totalTimeSpent,
      isTimerRunning: task.isTimerRunning,
      timeElapsed: task.isTimerRunning && task.timerStartedAt
        ? task.totalTimeSpent + Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000)
        : task.totalTimeSpent,
      replies: task.replies || [],
    }));

    return NextResponse.json({
      success: true,
      message: 'Tasks fetched successfully',
      data: formattedTasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/tasks error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tasks', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/tasks
 * Create a new task (admin only)
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

    // Only admin can create tasks
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admin can create tasks', error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createTaskSchema.safeParse(body);
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

    // Create task
    const task = await Task.create({
      title: validationResult.data.title,
      description: validationResult.data.description,
      priority: validationResult.data.priority,
      assignedTo: validationResult.data.assignedTo,
      assignedBy: session.user.id,
      status: 'pending',
      totalTimeSpent: 0,
      isTimerRunning: false,
      replies: [],
    });

    // Populate and return
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!populatedTask) {
      return NextResponse.json(
        { success: false, message: 'Task not found after creation', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Convert to plain object for response
    const taskObj = populatedTask.toObject();

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
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
        timeElapsed: 0,
        replies: [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/tasks error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create task', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
