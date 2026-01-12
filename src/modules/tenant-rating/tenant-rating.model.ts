import mongoose, { model, Schema } from "mongoose";
import type { ITenantRating } from "./tenant-rating.interface";

const TenantRatingSchema: Schema<ITenantRating> = new Schema(
  {
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 }, // 1-5 stars
    comment: { type: String, required: false, trim: true, maxLength: 1000 }, // max 1000 characters;
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    averageRating: { type: Number, required: false, min: 1, max: 5 },
  },
  { timestamps: true }
);

const TenantRating = model<ITenantRating>("TenantRating", TenantRatingSchema);
export default TenantRating;
