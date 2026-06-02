import { Schema, model, Document, Types } from 'mongoose';

export type AIMessageRole = 'user' | 'assistant';

export interface IAIMessage {
  role: AIMessageRole;
  content: string;
  createdAt: Date;
}

/**
 * A tutor chat thread between a user and the AI assistant, optionally scoped to
 * a course/lesson for grounded answers. Messages are embedded (bounded threads).
 */
export interface IAIConversation extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId?: Types.ObjectId;
  lessonId?: Types.ObjectId;
  title: string;
  messages: IAIMessage[];
  /** Last provider that answered in this thread (for display/debugging). */
  lastProvider?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IAIMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const aiConversationSchema = new Schema<IAIConversation>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
    title: { type: String, required: true, maxlength: 200 },
    messages: { type: [messageSchema], default: [] },
    lastProvider: { type: String },
  },
  { timestamps: true },
);

aiConversationSchema.index({ tenantId: 1, userId: 1, updatedAt: -1 });

export const AIConversation = model<IAIConversation>('AIConversation', aiConversationSchema);
