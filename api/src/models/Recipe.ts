import mongoose, { Schema, Document } from "mongoose";

export interface IRecipe extends Document {
  menuItemId: mongoose.Types.ObjectId;
  inventoryItemId: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecipeSchema = new Schema<IRecipe>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { timestamps: true }
);

RecipeSchema.index({ menuItemId: 1, inventoryItemId: 1 }, { unique: true });
RecipeSchema.index({ menuItemId: 1 });

export const Recipe = mongoose.model<IRecipe>("Recipe", RecipeSchema);
