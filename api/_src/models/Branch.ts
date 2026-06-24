import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  name: string;
  addressLine?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  isActive: boolean;
  openingTime?: string;
  closingTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    addressLine: { type: String },
    city: { type: String },
    pincode: { type: String },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    openingTime: { type: String },
    closingTime: { type: String },
  },
  { timestamps: true }
);

export const Branch = mongoose.model<IBranch>("Branch", BranchSchema);
