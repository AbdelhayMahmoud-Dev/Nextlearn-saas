import { Schema, model, Document, Types } from 'mongoose';

export interface IRubricCriterion {
  criterion: string;
  maxPoints: number;
}

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  lessonId: Types.ObjectId;
  title: string;
  description: string;
  rubric: IRubricCriterion[];
  dueDate?: Date;
  maxScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const rubricSchema = new Schema<IRubricCriterion>(
  {
    criterion: { type: String, required: true },
    maxPoints: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const assignmentSchema = new Schema<IAssignment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '' },
    rubric: { type: [rubricSchema], default: [] },
    dueDate: { type: Date },
    maxScore: { type: Number, default: 100, min: 0 },
  },
  { timestamps: true },
);

export const Assignment = model<IAssignment>('Assignment', assignmentSchema);
