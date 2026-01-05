import { model, Schema } from "mongoose";
import type { ILandlordRating } from "./landlord-rating.interface";

const landlordRatingSchema = new Schema<ILandlordRating>({
  landlord: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: false, trim: true, maxLength: 1000 },
  tenant: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const LandlordRating = model<ILandlordRating>(
  "LandlordRating",
  landlordRatingSchema
);

export default LandlordRating;
