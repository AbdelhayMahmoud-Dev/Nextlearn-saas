import { Schema, model, Document, Types } from 'mongoose';

export interface IProgress extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  lessonId: Types.ObjectId;
  courseId: Types.ObjectId;
  isCompleted: boolean;
  /** Furthest watched position in the lesson video, in seconds. */
  watchedSeconds: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    isCompleted: { type: Boolean, default: false },
    watchedSeconds: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// One progress record per user per lesson; fast lookups per user+course.
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
progressSchema.index({ userId: 1, courseId: 1 });

export const Progress = model<IProgress>('Progress', progressSchema);
