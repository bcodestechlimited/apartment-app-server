import mongoose, { Schema } from "mongoose";
import type { ITransaction } from "./transaction.interface";

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["withdrawal", "deposit", "transfer", "payment", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    bankAccountNumber: {
      type: String,
      default: null,
    },
    bankAccountName: {
      type: String,
      default: null,
    },
    bankName: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "success",
        "failed",
        "expired",
        "needs_refund",
        "refunded",
      ],
      default: "pending",
    },
    reference: {
      type: String,
      default: null,
    },
    method: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "wallet"],
    },
    provider: {
      type: String,
      enum: ["paystack", "flutterwave", "wallet"],
    },
    currency: {
      type: String,
      enum: ["NGN", "USD", "EUR", "GBP"],
      default: "NGN",
    },
    adminApproval: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

TransactionSchema.pre("save", function (next) {
  if (this.adminApproval === "approved" && !this.approvalDate) {
    this.approvalDate = new Date();
  }
  // if (
  //   this.transactionType === "payment" ||
  //   (this.transactionType === "deposit" && this.adminApproval !== "approved") ||
  //   this.adminApproval === "pending"
  // ) {
  //   this.adminApproval = "approved";
  //   this.approvalDate = new Date();
  // }
  next();
});

const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema,
);
export default Transaction;
