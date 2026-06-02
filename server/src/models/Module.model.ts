import { Schema, model, Document, Types } from 'mongoose';

export interface IModule extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  order: number;
  lessons: Types.ObjectId[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    order: { type: Number, required: true, default: 0 },
    lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Modules are almost always loaded for a course in display order.
moduleSchema.index({ courseId: 1, order: 1 });

export const Module = model<IModule>('Module', moduleSchema);
