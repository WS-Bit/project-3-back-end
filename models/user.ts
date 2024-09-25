import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator'
import mongooseHidden from 'mongoose-hidden'

interface IUser {
  username: string,
  email: string,
  password: string,
  uploads: mongoose.Types.ObjectId[],
  favourites: mongoose.Types.ObjectId[],
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
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
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

  usersSchema.pre('save', function(next) {
    if (!this.isModified('password')) return next(); // Only hash if password is modified
    this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync());
    next();
});


usersSchema.index({ email: 1 }, { unique: true });

export function validatePassword(plainTextPassword: string, hashPasswordFromDB: string): boolean {
  return bcrypt.compareSync(plainTextPassword, hashPasswordFromDB);
}

usersSchema.plugin(mongooseHidden({ defaultHidden: {password: true}}))

const User = mongoose.model('User', usersSchema);

export default User;