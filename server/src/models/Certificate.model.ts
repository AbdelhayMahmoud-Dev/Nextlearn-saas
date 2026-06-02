import { randomUUID } from 'crypto';
import { Schema, model, Document, Types } from 'mongoose';

export interface ICertificate extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  /** Public, unguessable identifier used in the verification URL. */
  certificateNumber: string;
  templateId?: string;
  issuedAt: Date;
  verificationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    certificateNumber: { type: String, required: true, unique: true, default: () => randomUUID() },
    templateId: { type: String },
    issuedAt: { type: Date, default: Date.now },
    verificationUrl: { type: String },
  },
  { timestamps: true },
);

export const Certificate = model<ICertificate>('Certificate', certificateSchema);
