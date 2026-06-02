import { Schema, model, Document, Types } from 'mongoose';

export interface IQuizAnswer {
  questionIndex: number;
  selected: number[];
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  answers: IQuizAnswer[];
  /** Achieved score as a percentage. */
  score: number;
  passed: boolean;
  attemptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IQuizAnswer>(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    selected: { type: [Number], default: [] },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0, min: 0, max: 100 },
    passed: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ userId: 1, quizId: 1 });

export const QuizAttempt = model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
