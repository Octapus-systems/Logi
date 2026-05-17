import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import { sendTaskAssignedEmail } from '@/lib/email';


export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this automatically)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
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
          console.error(`Cron: Failed to send email for task ${task._id}:`, err)
        );
      }
    });

    await Promise.allSettled(emailPromises);

    console.log(`Cron: Dispatched ${dueTasks.length} scheduled task(s)`);

    return NextResponse.json({
      success: true,
      message: `Dispatched ${dueTasks.length} scheduled task(s)`,
      dispatched: dueTasks.length,
    });
  } catch (error) {
    console.error('Cron dispatch-tasks error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to dispatch tasks', error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
