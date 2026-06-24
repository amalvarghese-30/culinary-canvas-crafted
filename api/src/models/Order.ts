import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  menuItemId?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  addons?: { name: string; price: number }[];
  notes?: string;
}

export interface IOrder extends Document {
  orderNumber: number;
  userId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  tableId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  promoCode?: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled";
  type: "dine-in" | "takeaway" | "delivery" | "online";
  paymentMethod?: "cash" | "card" | "upi" | "online";
  paymentStatus: "pending" | "paid" | "refunded" | "partial";
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  refundedAmount: number;
  estimatedReadyAt?: Date;
  notes?: string;
  pointsEarned: number;
  pointsRedeemed: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  source?: "web" | "pos" | "kiosk" | "qr" | "swiggy" | "zomato";
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    addons: [{ name: String, price: Number }],
    notes: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: Number, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    tableId: { type: Schema.Types.ObjectId, ref: "RestaurantTable" },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    promoCode: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery", "online"],
      default: "dine-in",
    },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "online"] },
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded", "partial"], default: "pending" },
    customerName: { type: String },
    customerPhone: { type: String },
    deliveryAddress: { type: String },
    refundedAmount: { type: Number, default: 0 },
    estimatedReadyAt: { type: Date },
    notes: { type: String },
    pointsEarned: { type: Number, default: 0 },
    pointsRedeemed: { type: Number, default: 0 },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    source: { type: String, enum: ["web", "pos", "kiosk", "qr", "swiggy", "zomato"], default: "web" },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ branchId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
