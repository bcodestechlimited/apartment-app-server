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
    description: {
      type: String,
      required: [true, "Please provide a property description"],
      trim: true,
    },
    amenities: {
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
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Other specific fields
    numberOfRooms: {
      type: String,
    },

    // Co-working-space-specific fields
    availability: {
      type: [String], // e.g., ['Monday', 'Tuesday']
      default: [],
    },
    pricingModel: {
      type: String,
      enum: Object.values(PricingModel),
    },
    seatingCapacity: {
      type: Number,
      min: [1, "Seating capacity must be at least 1"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProperty>("Property", PropertySchema);
