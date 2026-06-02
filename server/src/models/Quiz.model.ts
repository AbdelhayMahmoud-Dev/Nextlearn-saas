import { Schema, model, Document, Types } from 'mongoose';

export type QuizQuestionType = 'single' | 'multiple' | 'boolean';

export interface IQuizQuestion {
  text: string;
  type: QuizQuestionType;
  options: string[];
  /** Index/indices into `options` that are correct. */
  correctAnswer: number[];
  points: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  lessonId: Types.ObjectId;
  questions: IQuizQuestion[];
  /** Minimum percentage required to pass. */
  passingScore: number;
  /** Time limit in minutes; 0 = untimed. */
  timeLimit: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowRetry: boolean;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuizQuestion>(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ['single', 'multiple', 'boolean'], default: 'single' },
    options: { type: [String], default: [] },
    correctAnswer: { type: [Number], default: [] },
    points: { type: Number, default: 1, min: 0 },
    explanation: { type: String },
  },
  { _id: false },
);

const quizSchema = new Schema<IQuiz>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    questions: { type: [questionSchema], default: [] },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    timeLimit: { type: Number, default: 0, min: 0 },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    allowRetry: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 3, min: 1 },
  },
  { timestamps: true },
);

export const Quiz = model<IQuiz>('Quiz', quizSchema);
