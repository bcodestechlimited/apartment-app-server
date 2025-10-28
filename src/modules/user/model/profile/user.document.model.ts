import { Schema, model, Types } from "mongoose";
import type { IDocument } from "../../user.interface";

const documentSchema: Schema<IDocument> = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true }, // e.g. "ID Card", "Proof of Address"
    fileUrl: { type: String, required: true }, // S3 / Cloudinary URL
    uploadedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Document = model("Document", documentSchema);
