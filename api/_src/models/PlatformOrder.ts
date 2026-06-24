import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformOrder extends Document {
  platform: "swiggy" | "zomato";
  externalOrderId: string;
  internalOrderId: mongoose.Types.ObjectId;
  rawPayload: Record<string, any>;
  status: "received" | "acknowledged" | "rejected" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const PlatformOrderSchema = new Schema<IPlatformOrder>(
  {
    platform: { type: String, enum: ["swiggy", "zomato"], required: true },
    externalOrderId: { type: String, required: true },
    internalOrderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rawPayload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["received", "acknowledged", "rejected", "cancelled"], default: "received" },
  },
  { timestamps: true }
);

PlatformOrderSchema.index({ platform: 1, externalOrderId: 1 }, { unique: true });

export const PlatformOrder = mongoose.model<IPlatformOrder>("PlatformOrder", PlatformOrderSchema);
