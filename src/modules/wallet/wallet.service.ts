import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import { paginate } from "../../utils/paginate.js";
import type { ClientSession, ObjectId, PopulateOptions, Types } from "mongoose";
import type { IQueryParams } from "@/shared/interfaces/query.interface.js";
import Wallet from "./wallet.model.js";
import { TransactionService } from "../transaction/transaction.service.js";
import type { IWallet, UpdateWalletDTO } from "./wallet.interface.js";
import paystackClient from "@/lib/paystackClient.js";
import { AxiosError } from "axios";
import logger from "@/utils/logger.js";
import { env } from "@/config/env.config.js";
import UserService from "../user/user.service.js";

export class WalletService {
  static async topUpWallet(userId: Types.ObjectId, amount: number) {
    if (amount <= 100) {
      throw ApiError.badRequest("Top-up amount must be at least ₦100");
    }
    await this.getWalletByUserId(userId);

    const user = await UserService.findUserById(userId);

    let callback_url = "";
    if (user.roles.includes("landlord")) {
      callback_url = `${env.CLIENT_BASE_URL}/dashboard/landlord/paystack/verify`;
    } else if (user.roles.includes("tenant")) {
      callback_url = `${env.CLIENT_BASE_URL}/dashboard/paystack/verify`;
    }
    const response = await paystackClient.post("/transaction/initialize", {
      amount: amount * 100,
      email: user.email,

      callback_url: callback_url,
    }); // loalhost://5123/tickets/verify?appointementId=1234&reference=rtssdoq3

    const transaction = await TransactionService.createTransaction({
      user: userId,
      transactionType: "deposit",
      amount,
      description: "Wallet Topup",
      reference: response.data.data.reference,
      provider: "paystack",
      status: "pending",
      adminApproval: "approved",
    });
    return ApiSuccess.ok("Wallet Topup Initialized", {
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  }

  static async verifyTopUpWallet(userId: Types.ObjectId, reference: string) {
    const response = await paystackClient.get(
      `/transaction/verify/${reference}`,
    );
    if (response.data.data.status === "success") {
      // Handle successful payment here
      const transaction =
        await TransactionService.getTransactionByReference(reference);
      if (!transaction) {
        throw ApiError.notFound("Transaction not found");
      }
      console.log("Transaction found:", transaction);
      if (transaction.status === "success") {
        return ApiSuccess.ok("Wallet already topped up");
      }
      transaction.status = "success";
      await transaction.save();

      const userWallet = await this.getWalletByUserId(userId);
      console.log("User Wallet before topup:", userWallet);
      userWallet.balance += transaction.amount;
      console.log("User Wallet after topup:", userWallet);
      await userWallet.save();
      return ApiSuccess.ok("Wallet Topup Successful", { wallet: userWallet });
    }
    throw ApiError.badRequest("Payment not successful");
  }

  static async getWalletByUserId(
    userId: Types.ObjectId | string,
    session?: ClientSession,
  ): Promise<IWallet> {
    const existingWallet = await Wallet.findOne({ user: userId }).session(
      session || null,
    );

    if (existingWallet) {
      return existingWallet;
    }

    // Create new wallet
    const walletData = { user: userId, balance: 0 };

    if (session) {
      const [newWallet] = await Wallet.create([walletData], { session });
      return newWallet as IWallet;
    }

    const newWallet = await Wallet.create(walletData);
    return newWallet;
  }

  static async getWallet(userId: Types.ObjectId) {
    const wallet = await this.getWalletByUserId(userId);

    return ApiSuccess.ok("Wallet Details Retrieved Successfully", { wallet });
  }

  static async getUserWalletByAdmin(userId: ObjectId | string) {
    const wallet = await this.getWalletByUserId(userId as string);

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

  static async verifyAccountNumber(bankCode: string, accountNumber: string) {
    console.log("entering verifyAccountNumber");
    console.log({ bankCode, accountNumber });

    const response = await paystackClient.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    );
    console.log("Response:", response);
    return ApiSuccess.ok("Bank Details Verified Successfully", response.data);
  }

  static async withdrawFromWallet(userId: Types.ObjectId, amount: number) {
    if (amount <= 0) {
      throw ApiError.badRequest("Amount must be greater than zero");
    }

    const userWallet = await this.getWalletByUserId(userId);

    if (amount < 15000) {
      throw ApiError.badRequest(
        "Withdrawal amount should be at least 15,000 naira",
      );
    }

    if (amount > 300000) {
      throw ApiError.badRequest(
        "Withdrawal amount can't be above 300,000 naira",
      );
    }

    if (userWallet.balance < amount) {
      throw ApiError.badRequest("Insufficient balance");
    }

    if (!userWallet.hasSubmitted) {
      throw ApiError.forbidden("Please update your bank details");
    }

    if (userWallet.isBlocked) {
      throw ApiError.forbidden(
        "Your wallet has been disabled. Please contact the admin",
      );
    }

    // Update the user's balance
    userWallet.balance -= amount;

    const transaction = await TransactionService.createTransaction({
      user: userId,
      transactionType: "withdrawal",
      amount,
      bankAccountNumber: userWallet.bankAccountNumber,
      bankAccountName: userWallet.bankAccountName,
      bankName: userWallet.bankName,
      description: "Withdrawal",
      status: "pending",
      provider: "paystack",
      adminApproval: "pending",
    });

    await userWallet.save();

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
    userId: Types.ObjectId,
    updatedWalletDetails: UpdateWalletDTO,
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
      wallet.bankName = data.data.details.bank_name;
      wallet.bankAccountNumber = data.data.details.account_number;
      wallet.hasSubmitted = true;

      await wallet.save();

      await UserService.updateUserPaystackReceipientCode(
        userId,
        wallet.recipientCode as string,
      );

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

  static async blockUserWallet(userId: string | Types.ObjectId | ObjectId) {
    const wallet = await this.getWalletByUserId(userId as string);

    wallet.isBlocked = false;
    await wallet.save();

    return ApiSuccess.ok("Wallet blocked successfully", { wallet });
  }

  static async unBlockUserWallet(userId: string | Types.ObjectId | ObjectId) {
    const wallet = await this.getWalletByUserId(userId as string);

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

  static async approveWithdrawal() {}
}

export const walletService = new WalletService();
