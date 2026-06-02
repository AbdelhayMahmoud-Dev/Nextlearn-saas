import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  rating: number;
  comment?: string;
  /** True when the reviewer is a verified, enrolled student. */
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One review per user per course.
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);
