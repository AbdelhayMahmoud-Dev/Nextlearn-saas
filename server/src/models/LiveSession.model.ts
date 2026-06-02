import { Schema, model, Document, Types } from 'mongoose';

export type LiveSessionStatus = 'scheduled' | 'live' | 'ended';

export interface ILiveSession extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  instructorId: Types.ObjectId;
  title: string;
  scheduledAt: Date;
  /** Planned duration in minutes. */
  duration: number;
  meetingUrl?: string;
  attendees: Types.ObjectId[];
  status: LiveSessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionSchema = new Schema<ILiveSession>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    scheduledAt: { type: Date, required: true, index: true },
    duration: { type: Number, default: 60, min: 0 },
    meetingUrl: { type: String },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
      index: true,
    },
  },
  { timestamps: true },
);

export const LiveSession = model<ILiveSession>('LiveSession', liveSessionSchema);
