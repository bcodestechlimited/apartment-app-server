import mongoose, { Schema } from "mongoose";
import type { ISystemSetting } from "./system-settings.interface";

const SystemSettingSchema: Schema<ISystemSetting> = new Schema(
  {
    platformFeePercentage: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
      max: 100,
    },
    supportEmail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const SystemSetting = mongoose.model<ISystemSetting>(
  "SystemSetting",
  SystemSettingSchema,
);
export default SystemSetting;
