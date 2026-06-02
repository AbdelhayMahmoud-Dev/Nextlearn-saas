import { Schema, model, Document, Types } from 'mongoose';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ICourseRating {
  average: number;
  count: number;
}

export type EnrollmentType = 'free' | 'one-time' | 'subscription' | 'both';

export interface ICourse extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  instructorId: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  previewVideo?: string;
  category: string;
  level: CourseLevel;
  tags: string[];
  price: number;
  salePrice?: number;
  currency: string;
  language: string;
  enrollmentType: EnrollmentType;
  modules: Types.ObjectId[];
  /** Total runtime across all lessons, in seconds. */
  totalDuration: number;
  totalLessons: number;
  enrolledCount: number;
  rating: ICourseRating;
  requirements: string[];
  outcomes: string[];
  isPublished: boolean;
  isFeatured: boolean;
  /** Admin moderation flag. `false` = pending review / rejected. */
  isApproved: boolean;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    thumbnail: { type: String },
    previewVideo: { type: String },
    category: { type: String, required: true, index: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    salePrice: { type: Number, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, minlength: 3, maxlength: 3 },
    language: { type: String, default: 'en' },
    modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
    totalDuration: { type: Number, default: 0, min: 0 },
    totalLessons: { type: Number, default: 0, min: 0 },
    enrolledCount: { type: Number, default: 0, min: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    shortDescription: { type: String, maxlength: 200 },
    enrollmentType: {
      type: String,
      enum: ['free', 'one-time', 'subscription', 'both'],
      default: 'free',
    },
    requirements: { type: [String], default: [] },
    outcomes: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    // Default true = auto-approved (admins moderate exceptions, not every course).
    isApproved: { type: Boolean, default: true, index: true },
    rejectionReason: { type: String },
  },
  { timestamps: true },
);

// Slug unique within a tenant; full-text search over discoverable fields.
courseSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Course = model<ICourse>('Course', courseSchema);
