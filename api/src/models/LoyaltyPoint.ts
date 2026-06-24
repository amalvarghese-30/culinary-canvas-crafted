import mongoose, { Schema, Document } from "mongoose";

export interface ILoyaltyPoint extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  points: number;
  reason: string;
  createdAt: Date;
}

const LoyaltyPointSchema = new Schema<ILoyaltyPoint>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

LoyaltyPointSchema.index({ userId: 1 });
LoyaltyPointSchema.index({ createdAt: -1 });

export const LoyaltyPoint = mongoose.model<ILoyaltyPoint>("LoyaltyPoint", LoyaltyPointSchema);
