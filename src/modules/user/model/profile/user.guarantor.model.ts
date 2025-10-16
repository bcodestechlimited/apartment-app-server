import { Schema, model, Types } from "mongoose";
import type { IGuarantor } from "../../user.interface";

const guarantorSchema: Schema<IGuarantor> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    occupation: { type: String, required: true },
    workAddress: { type: String, required: true },
    homeAddress: { type: String, required: true },
  },
  { timestamps: true }
);

export const Guarantor = model("Guarantor", guarantorSchema);
