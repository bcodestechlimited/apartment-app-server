import { Schema, model, Types } from "mongoose";
import type { INextOfKin } from "../../user.interface";

const nextOfKinSchema: Schema<INextOfKin> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    relationship: { type: String, default: "" },
  },
  { timestamps: true }
);

const NextOfKin = model("NextOfKin", nextOfKinSchema);

export default NextOfKin;
