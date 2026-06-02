import { Schema, model, Document, Types } from 'mongoose';

export type EnrollmentStatus = 'active' | 'expired' | 'refunded';

export interface IEnrollmentProgress {
  completedLessons: Types.ObjectId[];
  lastLesson?: Types.ObjectId;
  percentage: number;
}

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  paymentId?: Types.ObjectId;
  status: EnrollmentStatus;
  progress: IEnrollmentProgress;
  enrolledAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    status: {
      type: String,
      enum: ['active', 'expired', 'refunded'],
      default: 'active',
      index: true,
    },
    progress: {
      completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
      lastLesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
      percentage: { type: Number, default: 0, min: 0, max: 100 },
    },
    enrolledAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// A user can only be enrolled in a given course once.
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);
