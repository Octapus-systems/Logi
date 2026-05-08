import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Attendance status enum
 */
export type AttendanceStatus = 'checked-in' | 'checked-out' | 'absent';

/**
 * Break history entry interface
 */
export interface IBreakHistory {
  breakStartTime: Date;
  breakEndTime: Date;
}

/**
 * Attendance interface with lives tracking
 */
export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: AttendanceStatus;
  lives: number;
  lastReplyAt?: Date;
  lastDeductionAt?: Date;
  isHalfDay: boolean;
  isOnBreak: boolean;
  breakHistory: IBreakHistory[];
  remainingCountdownSeconds: number;
  currentBreakStart?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
      enum: ['checked-in', 'checked-out', 'absent'],
      default: 'absent',
    },
    lives: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    lastReplyAt: {
      type: Date,
      default: null,
    },
    lastDeductionAt: {
      type: Date,
      default: null,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    isOnBreak: {
      type: Boolean,
      default: false,
    },
    breakHistory: [
      {
        breakStartTime: {
          type: Date,
          required: true,
        },
        breakEndTime: {
          type: Date,
          required: true,
        },
      },
    ],
    remainingCountdownSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentBreakStart: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique attendance per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

/**
 * Create or get the Attendance model
 */
const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
