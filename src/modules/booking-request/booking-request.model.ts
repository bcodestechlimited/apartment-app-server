import mongoose, { Schema } from "mongoose";
import type { IBookingRequest } from "./booking-request.interface";

const BookingRequestSchema: Schema<IBookingRequest> = new Schema(
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
      min: [0, "Total price must be a positive number"],
      default: 0,
    },
    netPrice: {
      type: Number,
      min: [0, "Net price must be a positive number"],
      default: 0,
    },
    otherFees: {
      type: [
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
      default: [],
    },
    platformFee: {
      type: Number,
      min: [0, "Platform fee must be a positive number"],
      default: 0,
    },
    paymentDue: {
      type: Date,
      default: null,
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
      enum: ["pending", "approved", "declined", "expired"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const BookingRequest = mongoose.model<IBookingRequest>(
  "BookingRequest",
  BookingRequestSchema,
);

export default BookingRequest;
