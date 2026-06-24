import mongoose, { Schema, Document } from "mongoose";

export interface ILoyaltyRedemption extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  points: number;
  value: number;
  createdAt: Date;
}

const LoyaltyRedemptionSchema = new Schema<ILoyaltyRedemption>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    points: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  { timestamps: true }
);

LoyaltyRedemptionSchema.index({ userId: 1 });
LoyaltyRedemptionSchema.index({ createdAt: -1 });

export const LoyaltyRedemption = mongoose.model<ILoyaltyRedemption>("LoyaltyRedemption", LoyaltyRedemptionSchema);
