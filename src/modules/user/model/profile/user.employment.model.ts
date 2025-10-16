import { Schema, model, Types } from "mongoose";
import type { IEmployment } from "../../user.interface";

const employmentSchema: Schema<IEmployment> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    employmentStatus: { type: String, default: "" },
    companyName: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    monthlyIncome: { type: String, default: "" },
    companyAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

const Employment = model("Employment", employmentSchema);

export default Employment;
