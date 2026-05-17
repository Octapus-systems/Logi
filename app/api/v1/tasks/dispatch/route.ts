import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import { sendTaskAssignedEmail } from '@/lib/email';


export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find all scheduled tasks whose time has arrived
    const now = new Date();
    const dueTasks = await Task.find({
      isScheduled: true,
      scheduledFor: { $lte: now },
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (dueTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled tasks to dispatch',
        dispatched: 0,
      });
    }

    // Mark all due tasks as no longer scheduled
    const taskIds = dueTasks.map((t) => t._id);
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: { isScheduled: false } }
    );

    // Send email notifications for each dispatched task
    const emailPromises = dueTasks.map(async (task) => {
      const assignedTo = task.assignedTo as any;
      if (assignedTo && assignedTo.email) {
        // Count active tasks for this user
        const activeTaskCount = await Task.countDocuments({
          assignedTo: assignedTo._id,
          status: { $in: ['todo', 'in-progress', 'stuck'] },
        });

        return sendTaskAssignedEmail(
          assignedTo.email,
          assignedTo.name || 'Staff Member',
          task.title,
          activeTaskCount
        ).catch((err) =>
          console.error(
            `Failed to send dispatch email for task ${task._id}:`,
            err
          )
        );
      }
    });

    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Dispatched ${dueTasks.length} scheduled task(s)`,
      dispatched: dueTasks.length,
    });
  } catch (error) {
    console.error('POST /api/v1/tasks/dispatch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to dispatch tasks',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
