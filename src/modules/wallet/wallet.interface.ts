import type { Document } from "mongoose";
import type { IUser } from "../user/user.interface";

export interface IWallet extends Document {
  user: IUser;
  balance: number;
  recipientCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  currency?: string;
  name?: string;
  hasSubmitted?: boolean;
  // walletId?: string;
  isActive?: boolean;
  isBlocked?: boolean;
}

export interface UpdateWalletDTO {
  bankCode: string;
  accountNumber: string;
}
