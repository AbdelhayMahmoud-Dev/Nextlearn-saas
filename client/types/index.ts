/**
 * Client-side TypeScript interfaces mirroring the Phase 1 Mongoose models.
 * Over the wire, ObjectIds are strings and Dates are ISO strings.
 *
 * Reference fields (e.g. `instructorId`) are ids by default; endpoints that
 * populate them expose an additional optional object field (e.g. `instructor`).
 */

/* ───────────────────────── Enums / unions ───────────────────────── */

export type UserRole = 'student' | 'instructor' | 'admin' | 'superadmin';
export type TenantPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'article' | 'quiz' | 'assignment' | 'live';
export type EnrollmentStatus = 'active' | 'expired' | 'refunded';
export type QuizQuestionType = 'single' | 'multiple' | 'boolean';
export type SubmissionStatus = 'pending' | 'reviewed' | 'graded';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'one-time' | 'subscription';
export type SubscriptionPlan = 'monthly' | 'annual';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid';
export type DiscountType = 'percent' | 'fixed';
export type LiveSessionStatus = 'scheduled' | 'live' | 'ended';
export type NotificationType =
  | 'enrollment'
  | 'course'
  | 'payment'
  | 'certificate'
  | 'review'
  | 'live'
  | 'assignment_graded'
  | 'system';

export type EnrollmentType = 'free' | 'one-time' | 'subscription' | 'both';

/* ───────────────────────── Shared shapes ───────────────────────── */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

/** Normalized client-side error (produced by api-client). */
export interface ApiErrorShape {
  message: string;
  statusCode: number;
  fieldErrors?: Record<string, string[]>;
}

export interface IAttachment {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface ISocialLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
}

export interface IUserPreferences {
  emailCourseUpdates: boolean;
  emailPromotions: boolean;
  emailWeeklyDigest: boolean;
  language: string;
}

/* ───────────────────────── Core models ───────────────────────── */

export interface ITenantBranding {
  logo?: string;
  primaryColor: string;
  accentColor: string;
  font: string;
}

export interface ITenant {
  _id: string;
  slug: string;
  name: string;
  domain?: string;
  branding: ITenantBranding;
  plan: TenantPlan;
  planExpiresAt?: string;
  stripeAccountId?: string;
  stripeAccountStatus?: 'pending' | 'active' | 'restricted' | 'disabled';
  stripeOnboardingComplete?: boolean;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Public tenant config from GET /tenant/config — applied at runtime for branding. */
export interface TenantConfig {
  tenantId: string;
  platformName: string;
  slug: string;
  branding: ITenantBranding;
  features: {
    enableCoupons: boolean;
    enableSubscriptions: boolean;
    enableCertificates: boolean;
    enableLiveSession: boolean;
    maxCoursesVisible: number;
  };
  plan: TenantPlan;
  isActive: boolean;
  maintenanceMode: boolean;
}

export interface IUser {
  _id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  socialLinks?: ISocialLinks;
  preferences: IUserPreferences;
  enrollments: string[];
  certificates: string[];
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICourseRating {
  average: number;
  count: number;
}

export interface ICourse {
  _id: string;
  tenantId: string;
  instructorId: string;
  /** Present when the endpoint populates the instructor. */
  instructor?: Pick<IUser, '_id' | 'name' | 'avatar' | 'bio'>;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  previewVideo?: string;
  category: string;
  level: CourseLevel;
  tags: string[];
  price: number;
  salePrice?: number;
  currency: string;
  language: string;
  enrollmentType: EnrollmentType;
  modules: string[] | IModule[];
  totalDuration: number;
  totalLessons: number;
  enrolledCount: number;
  rating: ICourseRating;
  requirements: string[];
  outcomes: string[];
  isPublished: boolean;
  isFeatured: boolean;
  isApproved?: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IModule {
  _id: string;
  tenantId: string;
  courseId: string;
  title: string;
  order: number;
  lessons: string[] | ILesson[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ILessonContent {
  videoUrl?: string;
  duration?: number;
  article?: string;
  attachments: IAttachment[];
}

export interface ILesson {
  _id: string;
  tenantId: string;
  moduleId: string;
  courseId: string;
  title: string;
  type: LessonType;
  content: ILessonContent;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IEnrollmentProgress {
  completedLessons: string[];
  lastLesson?: string;
  percentage: number;
}

export interface IEnrollment {
  _id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  course?: ICourse;
  paymentId?: string;
  status: EnrollmentStatus;
  progress: IEnrollmentProgress;
  enrolledAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProgress {
  _id: string;
  tenantId: string;
  userId: string;
  lessonId: string;
  courseId: string;
  isCompleted: boolean;
  watchedSeconds: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Quiz question as sent to a student taking the quiz (no correct answers). */
export interface IQuizQuestionPublic {
  text: string;
  type: QuizQuestionType;
  options: string[];
  points: number;
}

/** Full quiz question (includes correct answers — grading/results only). */
export interface IQuizQuestion extends IQuizQuestionPublic {
  correctAnswer: number[];
  explanation?: string;
}

export interface IQuiz {
  _id: string;
  tenantId: string;
  lessonId: string;
  questions: IQuizQuestionPublic[];
  passingScore: number;
  timeLimit: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowRetry: boolean;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface IQuizAnswer {
  questionIndex: number;
  selected: number[];
}

export interface IQuizAttempt {
  _id: string;
  tenantId: string;
  userId: string;
  quizId: string;
  answers: IQuizAnswer[];
  score: number;
  passed: boolean;
  attemptedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRubricCriterion {
  criterion: string;
  maxPoints: number;
}

export interface IAssignment {
  _id: string;
  tenantId: string;
  lessonId: string;
  title: string;
  description: string;
  rubric: IRubricCriterion[];
  dueDate?: string;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISubmission {
  _id: string;
  tenantId: string;
  assignmentId: string;
  userId: string;
  /** Populated when requested with student info. */
  student?: Pick<IUser, '_id' | 'name' | 'email' | 'avatar'>;
  content: string;
  attachments: IAttachment[];
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
  isLate: boolean;
  submissionCount: number;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  tenantId: string;
  userId: string;
  courseId?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeReceiptUrl?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ISubscription {
  _id: string;
  tenantId: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICertificate {
  _id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  course?: Pick<ICourse, '_id' | 'title' | 'thumbnail' | 'slug'>;
  user?: Pick<IUser, '_id' | 'name'>;
  enrollmentId: string;
  certificateNumber: string;
  templateId?: string;
  issuedAt: string;
  verificationUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  _id: string;
  tenantId: string;
  userId: string;
  user?: Pick<IUser, '_id' | 'name' | 'avatar'>;
  courseId: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILiveSession {
  _id: string;
  tenantId: string;
  courseId: string;
  instructorId: string;
  title: string;
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  attendees: string[];
  status: LiveSessionStatus;
  createdAt: string;
  updatedAt: string;
}

/** Result of `POST /coupons/validate` — all monetary values in major units. */
export interface CouponValidationResult {
  valid: true;
  couponId: string;
  code: string;
  discount: {
    type: DiscountType;
    value: number;
    originalPrice: number;
    savings: number;
    finalPrice: number;
  };
}

export interface ICoupon {
  _id: string;
  tenantId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  applicableCourses: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IWhiteLabelFeatures {
  liveSessions: boolean;
  certificates: boolean;
  coupons: boolean;
  customDomain: boolean;
}

export interface IWhiteLabel {
  _id: string;
  tenantId: string;
  name: string;
  logo?: string;
  primaryColor: string;
  accentColor: string;
  domain?: string;
  features: IWhiteLabelFeatures;
  plan: TenantPlan;
  createdAt: string;
  updatedAt: string;
}

/* ───────────────────────── Auth DTOs ───────────────────────── */

/** The authenticated user shape returned by the Express auth endpoints. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  isVerified: boolean;
  avatar?: string;
}
