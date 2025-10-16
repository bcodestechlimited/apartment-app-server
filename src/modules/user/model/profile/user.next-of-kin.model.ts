import { Schema, model, Types } from "mongoose";
import type { INextOfKin } from "../../user.interface";

const nextOfKinSchema: Schema<INextOfKin> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true },
  },
  { timestamps: true }
);

export const NextOfKin = model("NextOfKin", nextOfKinSchema);
