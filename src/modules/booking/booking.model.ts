import mongoose, { Schema } from "mongoose";
import type { IBooking, IBookingHistory } from "./booking.interface";

const BookingHistorySchema: Schema<IBookingHistory> = new Schema({
  booking: {
    type: Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  basePrice: {
    type: Number,
    min: [0, "Base price must be a positive number"],
    default: 0,
  },
  netPrice: {
    type: Number,
    min: [0, "Net price must be a positive number"],
    default: 0,
  },
  serviceChargeAmount: {
    type: Number,
    min: [0, "Service charge amount must be a positive number"],
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "success", "failed"],
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "bank_transfer"],
  },
  paymentProvider: {
    type: String,
    enum: ["paystack", "flutterwave"],
  },
  paymentReference: String,
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
  },
  movedToHistoryAt: {
    type: Date,
    default: Date.now,
  },
});

const BookingSchema: Schema<IBooking> = new Schema(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    moveOutDate: {
      type: Date,
      required: true,
    },
    basePrice: {
      type: Number,
      min: [0, "Base price must be a positive number"],
      default: 0,
    },
    netPrice: {
      type: Number,
      min: [0, "Net price must be a positive number"],
      default: 0,
    },
    serviceChargeAmount: {
      type: Number,
      min: [0, "Service charge amount must be a positive number"],
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer"],
      default: "bank_transfer",
    },
    paymentProvider: {
      type: String,
      enum: ["paystack", "flutterwave"],
      default: "paystack",
    },
    paymentReference: {
      type: String,
      required: false,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    canRenew: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;

export const BookingHistory = mongoose.model<IBookingHistory>(
  "BookingHistory",
  BookingHistorySchema
);
