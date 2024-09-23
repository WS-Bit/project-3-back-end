import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator'
import mongooseHidden from 'mongoose-hidden'

interface IUser {
  username: string,
  email: string, 
  password: string,
}

const usersSchema: Schema<IUser> = new mongoose.Schema<IUser>({
    username: { type: String, required: [true, 'A username is required'] },
    email: { type: String, 
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
  }, {
      timestamps: true,
      toJSON: {
        transform: function(doc, ret) {
          delete ret.password;
          delete ret._id;
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


usersSchema.pre('validate', function (this: any, next) {
  if (this.password !== this._confirmPassword) {
    this.invalidate('confirmPassword', 'Password confirmation does not match');
  }
  next();
});


usersSchema.index({ email: 1 }, { unique: true });

usersSchema.pre('save', function hashPassword(next) {
    this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync());
    next();
});

export function validatePassword(plainTextPassword: string, hashPasswordFromDB: string): boolean {
    return bcrypt.compareSync(plainTextPassword, hashPasswordFromDB);
}

usersSchema.plugin(mongooseHidden({ defaultHidden: {password: true}}))

const User = mongoose.model('User', usersSchema);

export default User;
