import mongoose, { Schema, Document } from "mongoose";

export interface IMenuAddon extends Document {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuAddonSchema = new Schema<IMenuAddon>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MenuAddonSchema.index({ menuItemId: 1 });

export const MenuAddon = mongoose.model<IMenuAddon>("MenuAddon", MenuAddonSchema);
