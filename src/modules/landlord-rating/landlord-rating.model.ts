import mongoose, { model, Schema } from "mongoose";
import type { ILandlordRating } from "./landlord-rating.interface";

const LandlordRatingSchema: Schema<ILandlordRating> = new Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 }, // 1-5 stars
    comment: { type: String, required: false, trim: true, maxLength: 1000 }, // max 1000 characters;
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    averageRating: { type: Number, required: false, min: 1, max: 5 },
  },
  { timestamps: true }
);

const LandlordRating = model<ILandlordRating>(
  "LandlordRating",
  LandlordRatingSchema
);
export default LandlordRating;
