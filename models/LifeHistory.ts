import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Life action type enum
 */
export type LifeActionType = 'deduct' | 'restore' | 'admin_deduct' | 'admin_restore';

/**
 * LifeHistory interface for TypeScript type safety
 */
export interface ILifeHistory extends Document {
  userId: mongoose.Types.ObjectId;
  attendanceId?: mongoose.Types.ObjectId;
  date: Date;
  action: LifeActionType;
  amount: number;
  reason: string;
  previousLives: number;
  newLives: number;
  adminId?: mongoose.Types.ObjectId;
  timestamp: Date;
  lastReplyAt?: Date;
  nextReplyAt?: Date;
  delayMinutes?: number;
  expectedDurationMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LifeHistory Schema Definition
 * Stores permanent record of all life changes for audit trail
 */
const LifeHistorySchema = new Schema<ILifeHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    action: {
      type: String,
      enum: ['deduct', 'restore', 'admin_deduct', 'admin_restore'],
      required: [true, 'Action type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0.5,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    previousLives: {
      type: Number,
      required: [true, 'Previous lives count is required'],
      min: 0,
    },
    newLives: {
      type: Number,
      required: [true, 'New lives count is required'],
      min: 0,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    lastReplyAt: {
      type: Date,
      default: null,
    },
    nextReplyAt: {
      type: Date,
      default: null,
    },
    delayMinutes: {
      type: Number,
      default: null,
    },
    expectedDurationMinutes: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
LifeHistorySchema.index({ userId: 1, date: -1 });
LifeHistorySchema.index({ userId: 1, timestamp: -1 });
LifeHistorySchema.index({ action: 1, timestamp: -1 });

/**
 * Create or get the LifeHistory model
 */
const LifeHistory: Model<ILifeHistory> =
  mongoose.models.LifeHistory || mongoose.model<ILifeHistory>('LifeHistory', LifeHistorySchema);

export default LifeHistory;
