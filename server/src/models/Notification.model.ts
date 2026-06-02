import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'enrollment'
  | 'course'
  | 'payment'
  | 'certificate'
  | 'review'
  | 'live'
  | 'assignment_graded'
  | 'subscription'
  | 'system';

export interface INotification extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['enrollment', 'course', 'payment', 'certificate', 'review', 'live', 'assignment_graded', 'subscription', 'system'],
      default: 'system',
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  { timestamps: true },
);

// Unread-first inbox queries per user.
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
