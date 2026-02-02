import type { Document, ObjectId, Types } from "mongoose";
import type { IUser } from "../user/user.interface";

export interface ITransaction extends Document {
  user: IUser;
  transactionType: "withdrawal" | "deposit" | "transfer" | "payment" | "debit";
  amount: number;
  platformFee?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  description?: string;
  status: "success" | "failed" | "pending";
  reference?: string;
  adminApproval: "pending" | "approved" | "rejected";
  approvedBy?: ObjectId;
  approvalDate?: Date;
  rejectionReason?: string;

  provider: "paystack" | "flutterwave" | "wallet";

  createdAt?: Date;
  updatedAt?: Date;
}

export interface createTransactionDTO {
  user: Types.ObjectId | string;
  transactionType: "withdrawal" | "deposit" | "transfer" | "payment" | "debit";
  amount: number;
  platformFee?: number;
  provider: "paystack" | "flutterwave" | "wallet";
  reference?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  description?: string;
  adminApproval?: "pending" | "approved" | "rejected";
  approvalDate?: Date;
  status?: "success" | "failed" | "pending";
}

export interface IProcessWithdrawal {
  transactionId: string;
  reason: string;
  action: "approved" | "rejected";
}
