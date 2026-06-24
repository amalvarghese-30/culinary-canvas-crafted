import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseOrderItem {
  inventoryItemId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface IPurchaseOrder extends Document {
  supplierId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  items: IPurchaseOrderItem[];
  totalCost: number;
  status: "draft" | "ordered" | "received" | "cancelled";
  notes?: string;
  orderedAt?: Date;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    inventoryItemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    costPerUnit: { type: Number, required: true },
    totalCost: { type: Number, required: true },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    items: { type: [PurchaseOrderItemSchema], required: true },
    totalCost: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "ordered", "received", "cancelled"],
      default: "draft",
    },
    notes: { type: String },
    orderedAt: { type: Date },
    receivedAt: { type: Date },
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ supplierId: 1 });
PurchaseOrderSchema.index({ status: 1 });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);
