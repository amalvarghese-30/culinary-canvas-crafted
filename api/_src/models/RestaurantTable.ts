import mongoose, { Schema, Document } from "mongoose";

export interface IRestaurantTable extends Document {
  name: string;
  branchId?: mongoose.Types.ObjectId;
  capacity: number;
  isOccupied: boolean;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantTableSchema = new Schema<IRestaurantTable>(
  {
    name: { type: String, required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    capacity: { type: Number, default: 4 },
    isOccupied: { type: Boolean, default: false },
    qrCode: { type: String },
  },
  { timestamps: true }
);

RestaurantTableSchema.index({ branchId: 1 });

export const RestaurantTable = mongoose.model<IRestaurantTable>("RestaurantTable", RestaurantTableSchema);
