import mongoose, { Schema, Document } from "mongoose";

export interface ILoyaltyTier extends Document {
  name: string;
  minPoints: number;
  multiplier: number;
  benefits: {
    freeDelivery: boolean;
    prioritySupport: boolean;
    birthdayReward: boolean;
    earlyAccess: boolean;
  };
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyTierSchema = new Schema<ILoyaltyTier>(
  {
    name: { type: String, required: true, unique: true },
    minPoints: { type: Number, required: true, default: 0 },
    multiplier: { type: Number, required: true, default: 1 },
    benefits: {
      freeDelivery: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      birthdayReward: { type: Boolean, default: false },
      earlyAccess: { type: Boolean, default: false },
    },
    icon: { type: String, default: "⭐" },
    color: { type: String, default: "#C0C0C0" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LoyaltyTier = mongoose.model<ILoyaltyTier>("LoyaltyTier", LoyaltyTierSchema);
