import { Schema, model, Types } from "mongoose";
import type { IPersonalInfo } from "../../user.interface";

const personalInfoSchema: Schema<IPersonalInfo> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    dob: { type: String, default: "" },
    address: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

const PersonalInfo = model("PersonalInfo", personalInfoSchema);

export default PersonalInfo;
