import mongoose, { Schema, Document } from "mongoose";

export interface IPromotion extends Document {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  branchId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number },
    minOrderValue: { type: Number },
    maxUses: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  },
  { timestamps: true }
);

export const Promotion = mongoose.model<IPromotion>("Promotion", PromotionSchema);
