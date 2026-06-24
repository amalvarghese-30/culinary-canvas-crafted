import mongoose, { Schema, Document } from "mongoose";

export interface IMenuCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MenuCategorySchema = new Schema<IMenuCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    imageUrl: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    parentId: { type: Schema.Types.ObjectId, ref: "MenuCategory" },
  },
  { timestamps: true }
);

MenuCategorySchema.index({ parentId: 1 });
MenuCategorySchema.index({ sortOrder: 1 });

export const MenuCategory = mongoose.model<IMenuCategory>("MenuCategory", MenuCategorySchema);
