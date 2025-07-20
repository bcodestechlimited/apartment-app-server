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
      //   required: [true, "Please provide a recipient code"],
    },
    bankName: {
      type: String,
      //   required: [true, "Please provide a bank name"],
    },
    bankAccountNumber: {
      type: String,
      //   required: [true, "Please provide a bank account number"],
    },
    bankAccountName: {
      type: String,
      //   required: [true, "Please provide a bank account name"],
    },
    currency: {
      type: String,
      //   required: [true, "Please provide a bank account number"],
    },
    hasSubmitted: {
      type: Boolean,
      default: false,
    },
    // walletId: {
    //   type: String,
    //   default: () => `WALLET-${nanoid(10)}`,
    //   unique: true,
    //   index: true,
    // },
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
