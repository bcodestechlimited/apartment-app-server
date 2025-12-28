import mongoose, { Schema } from "mongoose";
import type { IWallet } from "./wallet.interface";

const walletSchema: Schema<IWallet> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    recipientCode: {
      type: String,
    },
    bankName: {
      type: String,
    },
    bankAccountNumber: {
      type: String,
    },
    bankAccountName: {
      type: String,
    },
    currency: {
      type: String,
    },
    hasSubmitted: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWallet>("Wallet", walletSchema);
