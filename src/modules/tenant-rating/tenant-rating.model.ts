import { model, Schema } from "mongoose";
import type { ITenantRating } from "./tenant-rating.interface";

const tenantRatingSchema = new Schema<ITenantRating>({
  landlord: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: false, trim: true, maxLength: 1000 },
  tenant: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const TenantRating = model<ITenantRating>("TenantRating", tenantRatingSchema);

export default TenantRating;
