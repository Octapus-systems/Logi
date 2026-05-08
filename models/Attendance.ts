import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Attendance status enum
 */
export type AttendanceStatus = 'checked-in' | 'checked-out' | 'absent';

/**
 * Simplified attendance interface - only tracks check-in time
 */
export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: AttendanceStatus;
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
