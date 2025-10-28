import { Schema, model, Types } from "mongoose";
import type { IGuarantor } from "../../user.interface";

const guarantorSchema: Schema<IGuarantor> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    occupation: { type: String, default: "" },
    workAddress: { type: String, default: "" },
    homeAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

const Guarantor = model("Guarantor", guarantorSchema);

export default Guarantor;
