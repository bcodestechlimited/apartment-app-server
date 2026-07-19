import type { Document, ObjectId, Types } from "mongoose";
import type { IUser } from "../user/user.interface";

export interface ITransaction extends Document {
  user: IUser;
  transactionType: "withdrawal" | "deposit" | "transfer" | "payment" | "debit";
  amount: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  description?: string;
  adminApproval: "pending" | "approved" | "rejected";
  approvedBy?: ObjectId;
  approvalDate?: Date | null;
  rejectionReason?: string;
  reference?: string | null;
  status:
    "pending" | "success" | "failed" | "expired" | "needs_refund" | "refunded";
  provider: "paystack" | "flutterwave" | "wallet";
  method: "cash" | "card" | "bank_transfer" | "wallet" | null;
  currency: "NGN" | "USD" | "EUR" | "GBP";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface createTransactionDTO {
  user: Types.ObjectId | string;
  transactionType: "withdrawal" | "deposit" | "transfer" | "payment" | "debit";
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  description?: string;
  approvalDate?: Date;
  adminApproval?: "pending" | "approved" | "rejected";
  amount: number;
  reference?: string;
  method: "cash" | "card" | "bank_transfer" | "wallet" | null;
  currency: "NGN" | "USD" | "EUR" | "GBP";
  provider: "paystack" | "flutterwave" | "wallet";
  status:
    "pending" | "success" | "failed" | "expired" | "needs_refund" | "refunded";
}

export interface IProcessWithdrawal {
  transactionId: string;
  reason: string;
  action: "approved" | "rejected";
}
