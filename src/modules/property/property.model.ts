import mongoose, { Schema } from "mongoose";
import {
  PricingModel,
  PropertyType,
  type IProperty,
} from "./property.interface.js";

// Define possible pricing models

const PropertySchema: Schema<IProperty> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a property title"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Please provide a property address"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "Please provide a property state"],
      trim: true,
    },
    lga: {
      type: String,
      required: [true, "Please provide a property local government area"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a property description"],
      trim: true,
    },
    price: {
      type: String,
      required: [true, "Please provide a property price"],
      trim: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    facilities: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: Object.values(PropertyType),
      required: [true, "Please specify the property type"],
    },
    pictures: {
      type: [String],
      default: [],
    },

    // Other specific fields
    numberOfBedRooms: {
      type: String,
    },
    numberOfBathrooms: {
      type: String,
    },

    // Co-working-space-specific fields
    availabilityDate: {
      type: String, // e.g., ['Monday', 'Tuesday']
      default: "",
    },
    pricingModel: {
      type: String,
      enum: Object.values(PricingModel),
      required: [true, "Please specify the pricing model"],
    },
    seatingCapacity: {
      type: Number,
      min: [1, "Seating capacity must be at least 1"],
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    users: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProperty>("Property", PropertySchema);
