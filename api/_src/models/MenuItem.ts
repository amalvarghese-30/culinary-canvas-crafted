import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItem extends Document {
  name: string;
  slug: string;
  style: string;
  variant: string;
  description?: string;
  shortDescription?: string;
  price: number;
  category: string;
  subCategory?: string;
  filling?: string;
  pieceCount?: number;
  imageUrl?: string;
  galleryImages: string[];
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isChefSpecial: boolean;
  spice: number;
  badges: string[];
  sortOrder: number;
  preparationTime?: number;
  ingredients?: string;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  branchId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    style: { type: String, required: true },
    variant: { type: String, required: true },
    description: { type: String },
    shortDescription: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    filling: { type: String },
    pieceCount: { type: Number },
    imageUrl: { type: String },
    galleryImages: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isChefSpecial: { type: Boolean, default: false },
    spice: { type: Number, min: 1, max: 5, default: 1 },
    badges: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    preparationTime: { type: Number },
    ingredients: { type: String },
    nutritionalInfo: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
    },
    seoTitle: { type: String },
    seoDescription: { type: String },
    tags: { type: [String], default: [] },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const r = ret as Record<string, any>;
        r.id = r._id;
        delete r._id;
        delete r.__v;
        r.short_description = r.shortDescription;   delete r.shortDescription;
        r.sub_category = r.subCategory;             delete r.subCategory;
        r.piece_count = r.pieceCount;               delete r.pieceCount;
        r.image_url = r.imageUrl;                   delete r.imageUrl;
        r.gallery_images = r.galleryImages;         delete r.galleryImages;
        r.available = r.isAvailable;                delete r.isAvailable;
        r.is_vegetarian = r.isVegetarian;           delete r.isVegetarian;
        r.is_vegan = r.isVegan;                     delete r.isVegan;
        r.is_gluten_free = r.isGlutenFree;          delete r.isGlutenFree;
        r.is_featured = r.isFeatured;               delete r.isFeatured;
        r.is_best_seller = r.isBestSeller;          delete r.isBestSeller;
        r.is_chef_special = r.isChefSpecial;        delete r.isChefSpecial;
        r.preparation_time = r.preparationTime;     delete r.preparationTime;
        r.nutritional_info = r.nutritionalInfo;     delete r.nutritionalInfo;
        r.seo_title = r.seoTitle;                   delete r.seoTitle;
        r.seo_description = r.seoDescription;       delete r.seoDescription;
        r.sort_order = r.sortOrder;                 delete r.sortOrder;
        return r;
      },
    },
  }
);

MenuItemSchema.index({ category: 1 });
MenuItemSchema.index({ slug: 1 });
MenuItemSchema.index({ subCategory: 1 });
MenuItemSchema.index({ branchId: 1 });
MenuItemSchema.index({ isAvailable: 1 });
MenuItemSchema.index({ isFeatured: 1 });
MenuItemSchema.index({ isBestSeller: 1 });
MenuItemSchema.index({ tags: 1 });

export const MenuItem = mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
