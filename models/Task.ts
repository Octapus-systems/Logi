import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Task status enum
 */
export type TaskStatus = 'todo' | 'in-progress' | 'stuck' | 'done';

/**
 * Task priority enum
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Task interface for TypeScript type safety
 */
export interface ITask extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalTimeSpent: number; // in seconds
  isTimerRunning: boolean;
  timerStartedAt?: Date;
  replies: ITaskReply[];
}

/**
 * Task reply interface
 */
export interface ITaskReply {
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Task Reply Sub-schema
 */
const TaskReplySchema = new Schema<ITaskReply>(
  {
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Task Schema Definition
 */
const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'stuck', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to a user'],
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must have an assigner'],
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    totalTimeSpent: {
      type: Number,
      default: 0, // stored in seconds
      min: 0,
    },
    isTimerRunning: {
      type: Boolean,
      default: false,
    },
    timerStartedAt: {
      type: Date,
      default: null,
    },
    replies: [TaskReplySchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ status: 1 });

/**
 * Calculate current elapsed time if timer is running
 */
TaskSchema.methods.getCurrentElapsedTime = function (): number {
  if (this.isTimerRunning && this.timerStartedAt) {
    const now = new Date();
    const currentSession = Math.floor((now.getTime() - this.timerStartedAt.getTime()) / 1000);
    return this.totalTimeSpent + currentSession;
  }
  return this.totalTimeSpent;
};

/**
 * Format time in HH:MM:SS
 */
TaskSchema.methods.formatTime = function (): string {
  const totalSeconds = this.getCurrentElapsedTime();
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Create or get the Task model
 */
const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
