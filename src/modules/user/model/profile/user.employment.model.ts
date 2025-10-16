import { Schema, model, Types } from "mongoose";
import type { IEmployment } from "../../user.interface";

const employmentSchema: Schema<IEmployment> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    employmentStatus: { type: String, required: true },
    companyName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    monthlyIncome: { type: Number, required: true },
    companyAddress: { type: String, required: true },
  },
  { timestamps: true }
);

export const Employment = model("Employment", employmentSchema);
