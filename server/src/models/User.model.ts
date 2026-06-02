import { Schema, model, Types, HydratedDocument, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'instructor' | 'admin' | 'superadmin';

const BCRYPT_SALT_ROUNDS = 12;

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

export interface IUser {
  tenantId: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  socialLinks?: ISocialLinks;
  preferences: IUserPreferences;
  enrollments: Types.ObjectId[];
  certificates: Types.ObjectId[];
  /** SHA-256 hashes of active refresh tokens (multi-device, capped). */
  refreshTokens: string[];
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  /** Constant-time compare of a plaintext candidate against the stored hash. */
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin', 'superadmin'],
      default: 'student',
      index: true,
    },
    avatar: { type: String },
    bio: { type: String, maxlength: 1000 },
    socialLinks: {
      website: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
    },
    preferences: {
      emailCourseUpdates: { type: Boolean, default: true },
      emailPromotions: { type: Boolean, default: false },
      emailWeeklyDigest: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
    },
    enrollments: [{ type: Schema.Types.ObjectId, ref: 'Enrollment' }],
    certificates: [{ type: Schema.Types.ObjectId, ref: 'Certificate' }],
    refreshTokens: { type: [String], default: [], select: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationTokenExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Email is unique *within* a tenant — the same address may exist across tenants.
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
// Token lookups during email verification / password reset (sparse: most users have neither).
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

userSchema.pre('save', async function hashPassword(next): Promise<void> {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser, UserModel>('User', userSchema);
