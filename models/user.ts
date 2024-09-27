import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
import mongooseHidden from 'mongoose-hidden';

interface IUser {
  username: string;
  email: string;
  password: string;
  uploads: mongoose.Types.ObjectId[];
  favourites: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isEmailConfirmed: boolean;
  emailConfirmationToken?: string | null;
  emailConfirmationExpires?: Date | null;
}

const usersSchema: Schema<IUser> = new mongoose.Schema<IUser>({
  username: { type: String, required: [true, 'A username is required'] },
  email: { 
    type: String,
    required: [true, 'An e-mail is required'],
    unique: true,
    validate: (email: string) => validator.isEmail(email) 
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: (password: string) => validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minSymbols: 1,
      minNumbers: 1
    }),
  },
  uploads: [{ type: Schema.Types.ObjectId, ref: 'Release' }],
  favourites: [{ type: Schema.Types.ObjectId, ref: 'Release' }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isEmailConfirmed: { type: Boolean, default: false },
  emailConfirmationToken: String,
  emailConfirmationExpires: Date,
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  }
});

usersSchema.virtual('confirmPassword')
  .get(function (this: any) {
    return this._confirmPassword;
  })
  .set(function (this: any, value: string) {
    this._confirmPassword = value;
  });

usersSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

usersSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const validatePassword = (plainTextPassword: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(plainTextPassword, hashedPassword);
};

usersSchema.index({ email: 1 }, { unique: true });

usersSchema.plugin(mongooseHidden({ defaultHidden: { password: true, resetPasswordToken: true, resetPasswordExpires: true } }));

const User = mongoose.model<IUser>('User', usersSchema);

export default User;