import mongoose, { Schema } from "mongoose";
import type { ITenant } from "./tenant.interface";

const TenantSchema = new Schema<ITenant>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null, // null means tenant is still active
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // rentAmount: {
    //   type: Number,
    //   required: true,
    // },
    // paymentReference: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
  },
  { timestamps: true }
);

const Tenant = mongoose.model<ITenant>("Tenant", TenantSchema);

export default Tenant;
