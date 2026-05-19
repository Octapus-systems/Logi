import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Attendance from '@/models/Attendance';
import { z } from 'zod';
import { getISTTodayRange, getToday } from '@/lib/dateUtils';
import { sendTaskAssignedEmail } from '@/lib/email';



const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  scheduledFor: z.string().datetime({ offset: true }).optional().nullable(),
});


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

    // Check attendance status for staff
    if (session.user.role === 'staff') {
      const today = getToday();
      const attendance = await Attendance.findOne({
        userId: session.user.id,
        date: today,
      });

      if (attendance && attendance.status === 'checked-out') {
        return NextResponse.json({
          success: true,
          message: 'You have checked out for today. Your work is complete.',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
          isLocked: true
        });
      }
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build query based on user role
    let query: Record<string, unknown> = {};
    
    // Check for filters
    const showScheduled = searchParams.get('scheduled') === 'true';
    const showPending = searchParams.get('pending') === 'true';
    const showAll = searchParams.get('all') === 'true';
    const showPast = searchParams.get('past') === 'true';
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    
    // Handle role-based restrictions
    if (session.user.role === 'staff') {
      query.assignedTo = session.user.id;
      // Staff should NEVER see scheduled (future) tasks
      query.isScheduled = { $ne: true };
    } else if (session.user.role === 'admin') {
      const assignedTo = searchParams.get('assignedTo');
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
    }

    // Handle special status filters
    if (showScheduled) {
      // Show ONLY tasks waiting to be dispatched
      query.isScheduled = true;
    } else if (showPending) {
      // Pending shows all uncompleted tasks (anything not 'done')
      // This matches the "Uncompleted Tasks" logic in the attendance module
      query.status = { $ne: 'done' };
      query.isScheduled = { $ne: true }; 
    }

    // Handle standard status filter
    const statusParam = searchParams.get('status');
    if (statusParam && ['todo', 'in-progress', 'stuck', 'done'].includes(statusParam)) {
      query.status = statusParam;
      // When a specific status is chosen, show both scheduled (if dispatched) and non-scheduled tasks
      // But if they are still 'isScheduled: true', they are technically 'todo'.
    }

    // Handle Priority
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      query.priority = priority;
    }

    // Handle Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Handle Date Filtering
    if (dateParam) {
      const startOfDay = new Date(dateParam);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateParam);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Filter by createdAt OR scheduledFor
      const dateQueryCondition = {
        $or: [
          { createdAt: { $gte: startOfDay, $lte: endOfDay } },
          { scheduledFor: { $gte: startOfDay, $lte: endOfDay } }
        ]
      };
      query.$and = query.$and || [];
      (query.$and as Record<string, unknown>[]).push(dateQueryCondition);
    } else if (showPast) {
      const { start } = getISTTodayRange();
      query.createdAt = { $lt: start };
    } else if (!showAll && !showScheduled && !showPending && !statusParam && !search) {
      // Default to today only if no other major filters are active
      const { start, end } = getISTTodayRange();
      query.createdAt = { $gte: start, $lte: end };
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
      scheduledFor: task.scheduledFor,
      isScheduled: task.isScheduled,
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
    }));

    // Get counts for summary cards (ignoring the 'status' and 'pending/scheduled' filters of the current request)
    const countQuery = { ...query };
    delete countQuery.status;
    delete countQuery.isScheduled;

    const [pendingCount, scheduledCount, activeCount, stuckCount, doneCount] = await Promise.all([
      Task.countDocuments({ ...countQuery, status: { $ne: 'done' }, isScheduled: { $ne: true } }),
      Task.countDocuments({ ...countQuery, isScheduled: true }),
      Task.countDocuments({ ...countQuery, status: 'in-progress' }),
      Task.countDocuments({ ...countQuery, status: 'stuck' }),
      Task.countDocuments({ ...countQuery, status: 'done' }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Tasks fetched successfully',
      data: formattedTasks,
      statusCounts: {
        all: total,
        pending: pendingCount,
        scheduled: scheduledCount,
        active: activeCount,
        stuck: stuckCount,
        done: doneCount,
      },
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

    // Determine if task should be scheduled
    const scheduledForDate = validationResult.data.scheduledFor
      ? new Date(validationResult.data.scheduledFor)
      : null;
    
    // If a future date is provided, it's scheduled. 
    // We add a small buffer (30 seconds) to account for minor clock drift between client/server
    const isScheduled = scheduledForDate 
      ? scheduledForDate.getTime() > (Date.now() + 30000) 
      : false;

    console.log(`Creating task: title="${validationResult.data.title}", scheduledFor="${validationResult.data.scheduledFor}", isScheduled=${isScheduled}`);

    // Create task
    const task = await Task.create({
      title: validationResult.data.title,
      description: validationResult.data.description,
      priority: validationResult.data.priority,
      assignedTo: validationResult.data.assignedTo,
      assignedBy: session.user.id,
      scheduledFor: scheduledForDate,
      isScheduled,
      status: 'todo',
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

    // Count active tasks for this user
    const activeTaskCount = await Task.countDocuments({
      assignedTo: validationResult.data.assignedTo,
      status: { $in: ['todo', 'in-progress', 'stuck'] }
    });

    // Send email notification only for immediate tasks (not scheduled)
    const assignedTo = taskObj.assignedTo as any;
    if (!isScheduled && assignedTo && assignedTo.email) {
      await sendTaskAssignedEmail(
        assignedTo.email,
        assignedTo.name || 'Staff Member',
        taskObj.title,
        activeTaskCount
      ).catch(err => console.error('Failed to send task assignment email:', err));
    }

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
        scheduledFor: taskObj.scheduledFor,
        isScheduled: taskObj.isScheduled,
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
