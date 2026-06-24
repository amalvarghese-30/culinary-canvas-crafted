import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  restaurantName: string;
  tagline?: string;
  phone: string;
  phoneDisplay?: string;
  email?: string;
  address: string;
  city?: string;
  pincode?: string;
  hours: string;
  openingTime?: string;
  closingTime?: string;
  gstin?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  deliveryConfig: {
    minOrderForDelivery: number;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    estimatedTime: string;
  };
  meta: {
    seoTitle?: string;
    seoDescription?: string;
    ogImage?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    restaurantName: { type: String, required: true, default: "Momo House" },
    tagline: { type: String },
    phone: { type: String, required: true, default: "911234567890" },
    phoneDisplay: { type: String, default: "+91 12345 67890" },
    email: { type: String },
    address: { type: String, required: true, default: "12 Lake Road, Khan Market, New Delhi 110003" },
    city: { type: String },
    pincode: { type: String },
    hours: { type: String, default: "Daily 11:00 AM – 11:30 PM" },
    openingTime: { type: String },
    closingTime: { type: String },
    gstin: { type: String },
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
      twitter: { type: String },
      youtube: { type: String },
    },
    deliveryConfig: {
      minOrderForDelivery: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 40 },
      freeDeliveryThreshold: { type: Number, default: 500 },
      estimatedTime: { type: String, default: "30-45 min" },
    },
    meta: {
      seoTitle: { type: String },
      seoDescription: { type: String },
      ogImage: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>("Settings", SettingsSchema);
