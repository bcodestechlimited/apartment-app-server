import { Schema, model, Types } from "mongoose";
import type { IPersonalInfo } from "../../user.interface";

const personalInfoSchema: Schema<IPersonalInfo> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    dob: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
  },
  { timestamps: true }
);

const PersonalInfo = model("PersonalInfo", personalInfoSchema);

export default PersonalInfo;
