import { model, Schema } from "mongoose";
import type { IPropertyRating } from "./property-rating.interface";

const PropertyRatingSChema = new Schema<IPropertyRating>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 }, // 1-5 stars
    comment: { type: String, required: true, trim: true, maxLength: 1000 }, // max 1000 characters;
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);
const PropertyRating = model<IPropertyRating>(
  "PropertyRating",
  PropertyRatingSChema
);
export default PropertyRating;
