import { Schema, model, Document, Types } from 'mongoose';
import { IAttachment, attachmentSchema } from './common';

export type LessonType = 'video' | 'article' | 'quiz' | 'assignment' | 'live';

export interface ILessonContent {
  videoUrl?: string;
  /** Lesson video runtime in seconds. */
  duration?: number;
  /** Rich-text (HTML) article body for article lessons. */
  article?: string;
  attachments: IAttachment[];
}

export interface ILesson extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  moduleId: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  type: LessonType;
  content: ILessonContent;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      enum: ['video', 'article', 'quiz', 'assignment', 'live'],
      required: true,
      default: 'video',
    },
    content: {
      videoUrl: { type: String },
      duration: { type: Number, min: 0, default: 0 },
      article: { type: String },
      attachments: { type: [attachmentSchema], default: [] },
    },
    order: { type: Number, required: true, default: 0 },
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// courseId already has a single-field index via `index: true` on the path above.
lessonSchema.index({ moduleId: 1, order: 1 });

export const Lesson = model<ILesson>('Lesson', lessonSchema);
