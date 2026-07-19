import mongoose, { Schema } from "mongoose";
import type { IBooking, IBookingDay } from "./booking.interface";

const BookingSchema: Schema<IBooking> = new Schema(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
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
    transaction: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
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
    platformFee: {
      type: Number,
      min: [0, "platform fee amount must be a positive number"],
      default: 0,
    },
    otherFees: [
      {
        name: {
          type: String,
          required: [true, "Fee name is required"],
          trim: true,
        },
        amount: {
          type: Number,
          required: [true, "Fee amount is required"],
          min: [0, "Fee amount cannot be negative"],
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const BookingDaySchema = new Schema(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
  },
);

// Prevent duplicates
BookingDaySchema.index(
  {
    property: 1,
    date: 1,
  },
  {
    unique: true,
  },
);

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
export const BookingDay = mongoose.model<IBookingDay>(
  "BookingDay",
  BookingDaySchema,
);
