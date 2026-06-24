import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  menuItemId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ menuItemId: 1 });
ReviewSchema.index({ userId: 1 });

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
