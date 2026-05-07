import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Attendance status enum
 */
export type AttendanceStatus = 'checked-in' | 'checked-out' | 'absent' | 'on-break';

/**
 * Attendance interface for TypeScript type safety
 */
export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: AttendanceStatus;
  totalWorkingHours: number; // in seconds
  breaks: IBreak[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Break interface
 */
export interface IBreak {
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  reason?: string;
}

/**
 * Break Sub-schema
 */
const BreakSchema = new Schema<IBreak>(
  {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/**
 * Attendance Schema Definition
 */
const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['checked-in', 'checked-out', 'absent', 'on-break'],
      default: 'absent',
    },
    totalWorkingHours: {
      type: Number,
      default: 0, // in seconds
      min: 0,
    },
    breaks: [BreakSchema],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique attendance per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

/**
 * Calculate current working hours if checked in
 */
AttendanceSchema.methods.getCurrentWorkingHours = function (): number {
  if (this.status === 'checked-in' && this.checkInTime) {
    const now = new Date();
    let totalSeconds = Math.floor((now.getTime() - this.checkInTime.getTime()) / 1000);
    
    // Subtract break durations
    for (const breakItem of this.breaks as Array<{ startTime: Date; endTime?: Date; duration: number }>) {
      if (breakItem.endTime) {
        totalSeconds -= breakItem.duration;
      } else {
        // Ongoing break
        totalSeconds -= Math.floor((now.getTime() - breakItem.startTime.getTime()) / 1000);
      }
    }
    
    return Math.max(0, totalSeconds);
  }
  return this.totalWorkingHours;
};

/**
 * Format working hours in HH:MM:SS
 */
AttendanceSchema.methods.formatWorkingHours = function (): string {
  const totalSeconds = this.getCurrentWorkingHours();
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Check if currently on break
 */
AttendanceSchema.methods.isOnBreak = function (): boolean {
  return this.breaks.some((b: { startTime: Date; endTime?: Date }) => b.startTime && !b.endTime);
};

/**
 * Get remaining work time (4 hours - worked time)
 */
AttendanceSchema.methods.getRemainingWorkTime = function (): number {
  const fourHoursInSeconds = 4 * 60 * 60; // 4 hours
  const workedSeconds = this.getCurrentWorkingHours();
  return Math.max(0, fourHoursInSeconds - workedSeconds);
};

/**
 * Format remaining time in HH:MM:SS
 */
AttendanceSchema.methods.formatRemainingTime = function (): string {
  const remainingSeconds = this.getRemainingWorkTime();
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Create or get the Attendance model
 */
const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
