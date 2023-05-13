import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizations: Schema.Types.ObjectId[];
  setPassword: (password: string) => Promise<void>;
  generatePasswordResetToken: () => Promise<string>;
  comparePassword: (password: string) => Promise<boolean>;
  passwordResetToken: string | undefined;
  passwordResetTokenExpires: Date | undefined;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    organizations: [{ type: Schema.Types.ObjectId, ref: 'Organization' }],
    passwordResetToken: String,
    passwordResetTokenExpires: Date
  },
  { timestamps: true }
);

userSchema.methods.generatePasswordResetToken = async function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetTokenExpires = Date.now() + 3600000; // Token valid for 1 hour
  await this.save();
  return token;
};

userSchema.methods.setPassword = async function (password: string) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export const User = model<UserDocument>('User', userSchema);
