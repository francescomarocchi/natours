import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';
import validator from 'validator';

export interface IUser {
  name: string;
  email: string;
  photo: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangedAt?: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address']
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a password'],
    validate: {
      // Remember this only works with SAVE!!!
      validator: function(this: IUser, element: string): boolean {
        return element === this.password;
      },
      message: 'Passwords are not matching'
    }
  },
  passwordChangedAt: Date
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Hashed password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // we no longer need this
});

userSchema.methods.changedPasswordAfter = function(jwtTimestamp: Date) {
  if (this.passwordChangedAt) {

  }
};

export const User = mongoose.model('user', userSchema);
