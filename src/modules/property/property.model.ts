import mongoose, { Schema } from "mongoose";
import {
  PricingModel,
  PropertyType,
  type IProperty,
} from "./property.interface.js";

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
      type: Number,
      required: [true, "Please provide a property price"],
      min: [0, "Price must be a positive number"],
      default: 0,
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
    numberOfBedrooms: {
      type: Number,
      min: [1, "Number of bedrooms must be at least 1"],
      default: 1,
    },
    numberOfBathrooms: {
      type: Number,
      min: [1, "Number of bathrooms must be at least 1"],
      default: 1,
    },
    availabilityDate: {
      type: Date,
      required: [true, "Please provide a property availability date"],
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
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
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
    requestedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    bookedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model<IProperty>("Property", PropertySchema);

export default Property;
