import mongoose, { Schema, Document } from "mongoose";

export interface IReservation extends Document {
  userId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  partySize: number;
  reservationDate: Date;
  reservationTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
  notes?: string;
  tableId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    guestName: { type: String, required: true },
    guestPhone: { type: String },
    guestEmail: { type: String },
    partySize: { type: Number, required: true, min: 1 },
    reservationDate: { type: Date, required: true },
    reservationTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
      default: "pending",
    },
    notes: { type: String },
    tableId: { type: Schema.Types.ObjectId, ref: "RestaurantTable" },
  },
  { timestamps: true }
);

ReservationSchema.index({ branchId: 1, reservationDate: 1 });
ReservationSchema.index({ userId: 1 });

export const Reservation = mongoose.model<IReservation>("Reservation", ReservationSchema);
