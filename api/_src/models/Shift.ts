import mongoose, { Schema, Document } from "mongoose";

export interface IShift extends Document {
  userId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  role: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    role: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

ShiftSchema.index({ userId: 1 });
ShiftSchema.index({ branchId: 1, startTime: -1 });

export const Shift = mongoose.model<IShift>("Shift", ShiftSchema);
