import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import { paginate } from "../../utils/paginate.js";
import type { ObjectId, PopulateOptions } from "mongoose";
import type { IQueryParams } from "@/shared/interfaces/query.interface.js";
import Wallet from "./wallet.model.js";
import { TransactionService } from "../transaction/transaction.service.js";
import type { UpdateWalletDTO } from "./wallet.interface.js";
import paystackClient from "@/lib/paystackClient.js";
import { AxiosError } from "axios";
import logger from "@/utils/logger.js";

export class WalletService {
  static async getWalletByUserId(userId: ObjectId) {
    const existingWallet = await Wallet.findOne({ user: userId });

    if (!existingWallet) {
      const wallet = await Wallet.create({
        user: userId,
      });
      return wallet;
    }

    return existingWallet;
  }

  static async getWallet(userId: ObjectId) {
    const wallet = await this.getWalletByUserId(userId);

    return ApiSuccess.ok("Bank Details Retrieved Successfully", { wallet });
  }

  static async getUserWalletByAdmin(userId: ObjectId | string) {
    const wallet = await this.getWalletByUserId(userId as ObjectId);

    return ApiSuccess.ok("Bank Details Retrieved Successfully", { wallet });
  }

  static async getAllWallets(query: IQueryParams) {
    const { page = 1, limit = 10 } = query;
    const filterQuery = {};
    const sort = { createdAt: -1 };
    const populateOptions: PopulateOptions[] = [{ path: "user" }];

    const { documents: wallets, pagination } = await paginate({
      model: Wallet,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.ok("Wallets retrieved successfully", {
      wallets,
      pagination,
    });
  }

  static async withdrawFromWallet(userId: ObjectId, amount: number) {
    if (amount <= 0) {
      throw ApiError.badRequest("Amount must be greater than zero");
    }

    const userWallet = await this.getWalletByUserId(userId);

    if (amount < 15000) {
      throw ApiError.badRequest(
        "Withdrawal amount should be at least 15,000 naira"
      );
    }

    if (amount > 300000) {
      throw ApiError.badRequest(
        "Withdrawal amount can't be above 300,000 naira"
      );
    }

    if (userWallet.balance < amount) {
      throw ApiError.badRequest("Insufficient balance");
    }

    if (!userWallet.hasSubmitted) {
      throw ApiError.forbidden("Please update your bank details");
    }

    if (!userWallet.isBlocked) {
      throw ApiError.forbidden(
        "Your wallet has been disabled. Please contact the admin"
      );
    }

    // Update the user's balance
    userWallet.balance -= amount;
    await userWallet.save();

    const transaction = await TransactionService.createTransaction({
      user: userId,
      transactionType: "debit",
      amount,
      bankAccountNumber: userWallet.bankAccountNumber,
      bankAccountName: userWallet.bankAccountName,
      bankName: userWallet.bankName,
      description: "Withdrawal",
    });

    // Log the withdrawal transaction
    // const transaction = new Transaction({
    //   user: userId,
    //   transactionType: "debit",
    //   amount,
    //   accountNumber: wallet.bankAccountNumber,
    //   accountName: wallet.name,
    //   bankName: wallet.bankName,
    //   description: "Withdrawal",
    // });
    // await transaction.save();

    return ApiSuccess.ok("Withdrawal request submitted", {
      transaction,
    });
  }

  static async updateWallet(
    userId: ObjectId,
    updatedWalletDetails: UpdateWalletDTO
  ) {
    const wallet = await this.getWalletByUserId(userId);

    const { bankCode, accountNumber } = updatedWalletDetails;

    try {
      const { data } = await paystackClient.post("/transferrecipient", {
        type: "nuban",
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      });

      wallet.recipientCode = data.data.recipient_code;
      wallet.currency = data.data.currency;
      wallet.bankAccountName = data.data.details.account_name;
      wallet.bankAccountName = data.data.details.bank_name;
      wallet.bankAccountNumber = data.data.details.account_number;
      wallet.hasSubmitted = true;

      await wallet.save();

      return ApiSuccess.ok("Wallet Updated", { wallet });
    } catch (error) {
      if (error instanceof AxiosError) {
        const { response } = error;

        console.log({ data: response?.data });

        if (
          response?.data?.message ===
          "Your IP address is not allowed to make this call"
        ) {
          logger.error("Access from this IP denied! Please contact admin");
          throw ApiError.forbidden("Please contact admin");
        }

        if (response?.data?.code === "invalid_bank_code") {
          throw ApiError.badRequest("Account Does Not Exist");
        }
      }

      throw ApiError.internalServerError("Something went wrong");
    }
  }

  static async blockUserWallet(userId: ObjectId) {
    const wallet = await this.getWalletByUserId(userId);

    wallet.isBlocked = false;
    await wallet.save();

    return ApiSuccess.ok("Wallet blocked successfully", { wallet });
  }

  static async unBlockUserWallet(userId: ObjectId) {
    const wallet = await this.getWalletByUserId(userId);

    wallet.isBlocked = true;
    await wallet.save();

    return ApiSuccess.ok("Wallet unblocked successfully", { wallet });
  }

  static async getAllBanks() {
    try {
      const response = await paystackClient.get(`/bank?currency=NGN`);
      const banks = response.data.data;
      logger.info({ banks });
      return ApiSuccess.ok("Banks Retrieved Successfully", { banks });
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle Axios specific errors
        // if (error.response?.status === 400) {
        //   throw ApiError.badRequest("Invalid request parameters");
        // }
        if (error.response?.status === 401) {
          throw ApiError.unauthorized("Please contact admin");
        }
      }
      throw ApiError.internalServerError("Something went wrong");
    }
  }
}

export const walletService = new WalletService();
