import type { Document } from "mongoose";

export interface ISystemSetting extends Document {
  platformFeePercentage: number;
  supportEmail: string;
  // You can add other global settings here later (e.g., maintenanceMode: boolean)
}

export interface IUpdateSystemSetting {
  platformFeePercentage: number;
  supportEmail: string;
}
