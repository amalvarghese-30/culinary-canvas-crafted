import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  defaultAddressLine?: string;
  defaultCity?: string;
  defaultPincode?: string;
  roles: string[];
  googleId?: string;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    fullName: { type: String, required: true },
    phone: { type: String },
    defaultAddressLine: { type: String },
    defaultCity: { type: String },
    defaultPincode: { type: String },
    roles: { type: [String], default: ["customer"] },
    googleId: { type: String, unique: true, sparse: true },
    refreshToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
