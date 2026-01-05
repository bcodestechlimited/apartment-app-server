// user-stats.model.ts
import mongoose, { Schema } from "mongoose";
import type { IUserStats } from "./user-stats.interface";

const UserStatsSchema: Schema<IUserStats> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Landlord Fields
    totalEarnings: { type: Number, default: 0, min: 0 },
    pendingPayouts: { type: Number, default: 0, min: 0 },
    lastPayoutAmount: { type: Number, default: 0, min: 0 },
    lastPayoutDate: { type: Date },

    // Tenant Fields
    totalPaid: { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, default: 0, min: 0 },
    refundsProcessed: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const UserStats = mongoose.model<IUserStats>("UserStats", UserStatsSchema);
export default UserStats;
