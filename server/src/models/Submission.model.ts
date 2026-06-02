import { Schema, model, Document, Types } from 'mongoose';
import { IAttachment, attachmentSchema } from './common';

export type SubmissionStatus = 'pending' | 'reviewed' | 'graded';

export interface ISubmission extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  attachments: IAttachment[];
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
  isLate: boolean;
  submissionCount: number;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    score: { type: Number, min: 0 },
    feedback: { type: String },
    status: { type: String, enum: ['pending', 'reviewed', 'graded'], default: 'pending', index: true },
    isLate: { type: Boolean, default: false },
    submissionCount: { type: Number, default: 1, min: 1 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

submissionSchema.index({ assignmentId: 1, userId: 1 });

export const Submission = model<ISubmission>('Submission', submissionSchema);
