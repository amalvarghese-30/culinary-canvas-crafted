import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  description?: string;
  type: "email" | "sms" | "push" | "whatsapp" | "inapp";
  audience: Record<string, any>;
  message: string;
  isActive: boolean;
  scheduledAt?: Date;
  sentAt?: Date;
  sentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ["email", "sms", "push", "whatsapp", "inapp"], required: true },
    audience: { type: Schema.Types.Mixed, required: true },
    message: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    sentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model<ICampaign>("Campaign", CampaignSchema);
