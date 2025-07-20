import type { Document, ObjectId } from "mongoose";

export interface ITransaction extends Document {
  user: ObjectId;
  transactionType: "credit" | "debit";
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface createTransactionDTO {
  user: ObjectId;
  transactionType: "credit" | "debit";
  amount: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  description?: string;
}
