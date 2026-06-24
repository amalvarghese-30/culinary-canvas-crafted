import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryItem extends Document {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPerUnit: number;
  supplierId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    minQuantity: { type: Number, default: 0 },
    costPerUnit: { type: Number, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  },
  { timestamps: true }
);

InventoryItemSchema.index({ branchId: 1 });
InventoryItemSchema.index({ category: 1 });

export const InventoryItem = mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);
