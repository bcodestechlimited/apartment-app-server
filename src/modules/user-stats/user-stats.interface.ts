// user-stats.interface.ts
import type { Document, Types } from "mongoose";

export interface IUserStats extends Document {
  user: Types.ObjectId;

  // Landlord Specific Metrics (Revenue)
  totalEarnings: number; // Total net revenue generated
  pendingPayouts: number; // Amount earned but not yet disbursed
  lastPayoutAmount: number; // Value of the most recent payout
  lastPayoutDate?: Date; // Timestamp of the last successful payout

  // Tenant Specific Metrics (Payments)
  totalPaid: number; // Cumulative cleared rent payments
  outstandingBalance: number; // Sum of pending or overdue rent
  refundsProcessed: number; // Total amount reimbursed to the tenant

  createdAt: Date;
  updatedAt: Date;
}

// user-stats.interface.ts
export interface IUserStatsUpdateDTO {
  // Landlord Metrics
  totalEarnings?: number;
  pendingPayouts?: number;
  lastPayoutAmount?: number;
  lastPayoutDate?: Date;

  // Tenant Metrics
  totalPaid?: number;
  outstandingBalance?: number;
  refundsProcessed?: number;
}
