import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  menuItemId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, menuItemId: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1 });

export const Favorite = mongoose.model<IFavorite>("Favorite", FavoriteSchema);
