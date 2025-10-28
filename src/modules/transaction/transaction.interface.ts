import type { Document, ObjectId } from "mongoose";

export interface ITransaction extends Document {
  user: ObjectId;
  transactionType: "withdrawal" | "deposit" | "transfer" | "payment";
  amount: number;
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

  provider: "paystack" | "flutterwave";

  createdAt?: Date;
  updatedAt?: Date;
}

export interface createTransactionDTO {
  user: ObjectId;
  transactionType: "withdrawal" | "deposit" | "transfer" | "payment";
  amount: number;
  provider: "paystack" | "flutterwave";
  reference: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  description?: string;
  adminApproval?: "pending" | "approved" | "rejected";
  approvalDate?: Date;
}
