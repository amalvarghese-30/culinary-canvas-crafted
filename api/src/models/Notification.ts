import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: "order" | "reservation" | "promo" | "system" | "review";
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ["order", "reservation", "promo", "system", "review"],
      required: true,
    },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
