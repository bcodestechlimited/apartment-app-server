import mongoose, { Schema } from "mongoose";
import type { IReport } from "./report.interface";

const ReportSchema: Schema<IReport> = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "reviewed", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Report = mongoose.model<IReport>("Report", ReportSchema);

export default Report;
