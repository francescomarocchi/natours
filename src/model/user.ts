import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose, { Schema } from 'mongoose';
import validator from 'validator';

export enum UserRoles {
  User = 'user',
  Guide = 'guide',
  LeadGuide = 'lead-guide',
  Admin = 'admin',
}

export interface IUser {
  name: string;
  email: string;
  role: UserRoles;
  photo: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangedAt?: number;
  passwordResetToken?: string;
  passwordResetExpireDate?: Date;
  active: boolean;

  changedPasswordAfter(jwtTimestamp: Date): boolean;

  createPasswordResetToken(): string;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  role: {
    type: String,
    enum: [
      UserRoles.Admin,
      UserRoles.Guide,
      UserRoles.LeadGuide,
      UserRoles.User,
    ],
    default: UserRoles.User,
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a password'],
    validate: {
      // Remember this only works with SAVE!!!
      validator: function (this: IUser, element: string): boolean {
        return element === this.password;
      },
      message: 'Passwords are not matching',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpireDate: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre(/^find/, function (next) {
  // function taking RegExp has problems with "this" type
  (this as any).find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Hashed password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // we no longer need this
});

// TODO: in case implement this, is intended to block token validity
// if user has changed its password after token has been generated
userSchema.methods.changedPasswordAfter = function (jwtTimestamp: Date) {
  if (this.passwordChangedAt) {
    console.log(this.passwordChangedAt, jwtTimestamp)
    return this.passwordChangedAt > jwtTimestamp;
  }
  return false;
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.createPasswordResetToken =
  async function (): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.passwordResetExpireDate = Date.now() + 10 * 60 * 1_000;
    await this.save({ validateBeforeSave: false });
    return resetToken;
  };

export const User = mongoose.model('user', userSchema);
