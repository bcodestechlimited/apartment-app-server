import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";

import { paginate } from "../../utils/paginate.js";
import type { createTransactionDTO } from "./transaction.interface.js";
import Transaction from "./transaction.model.js";
import type { ObjectId, PopulateOptions, Types } from "mongoose";
import type { IQueryParams } from "@/shared/interfaces/query.interface.js";

export class TransactionService {
  static async createTransaction(data: createTransactionDTO) {
    const transaction = await Transaction.create(data);
    return transaction;
  }

  static async getTransactionById(
    transactionId: string,
    populateOptions: PopulateOptions[]
  ) {
    const transaction = await Transaction.findById(transactionId)
      .populate("user")
      .populate(populateOptions);

    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }

    return transaction;
  }

  static async getUserTransactions(
    userId: Types.ObjectId,
    query: IQueryParams
  ) {
    const { page = 1, limit = 10 } = query;
    console.log("Fetching transactions for user:", userId);
    const filterQuery = { user: userId };
    const sort = { createdAt: -1 };
    const populateOptions = [
      { path: "user", select: ["firstName", "lastName", "email"] },
    ];

    const { documents: transactions, pagination } = await paginate({
      model: Transaction,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.ok("Transaction history retrieved successfully", {
      transactions,
      pagination,
    });
  }

  static async getAllTransactions(query: IQueryParams) {
    const { page = 1, limit = 10 } = query;

    const sort = { createdAt: -1 };
    const populateOptions = [
      { path: "user", select: ["firstName", "lastName", "email"] },
    ];

    const { documents: transactions, pagination } = await paginate({
      model: Transaction,
      query: {},
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.ok("Transaction history retrieved successfully", {
      transactions,
      pagination,
    });
  }

  static async getTransaction(transactionId: string) {
    const populateOptions = [
      { path: "user", select: ["firstName", "lastName", "email"] },
    ];
    const transaction = await this.getTransactionById(
      transactionId,
      populateOptions
    );

    return ApiSuccess.ok("Transaction retrieved successfully", transaction);
  }

  static async getTransactionByReference(reference: string) {
    const populateOptions = [
      { path: "user", select: ["firstName", "lastName", "email"] },
    ];
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }
    return transaction;
  }

  //   static async updateTransaction(
  //     transactionId: string,
  //     updateData = {},
  //     userId: string
  //   ) {
  //     const { status, rejectionReason } = updateData;

  //     const populateOptions = [
  //       { path: "user", select: ["firstName", "lastName", "email"] },
  //     ];

  //     const transaction = await getTransactionById(
  //       transactionId,
  //       populateOptions
  //     );

  //     if (
  //       transaction.adminApproval === "approved" ||
  //       transaction.adminApproval === "rejected"
  //     ) {
  //       return ApiSuccess.ok(
  //         `Transaction already ${transaction.adminApproval}`,
  //         transaction
  //       );
  //     }

  //     if (status === "rejected") {
  //       transaction.approvedBy = userId;
  //       transaction.adminApproval = status;
  //       transaction.rejectionReason = rejectionReason;
  //       await transaction.save();
  //       //Return the amount back to their wallet
  //       const user = await authService.findUserByIdOrEmail(transaction.user._id);
  //       user.balance += transaction.amount;
  //       await user.save();

  //       // emailUtils

  //       return ApiSuccess.ok("Withdrawal request rejected", transaction);
  //     }

  //     const wallet = await walletService.getWallet(transaction.user._id);
  //     const withdrawalResponse = await initiatePaystackWithdrawal(
  //       transaction.amount,
  //       wallet.recipientCode
  //     );

  //     if (withdrawalResponse.status !== "success") {
  //       throw ApiError.internalServerError("Paystack withdrawal failed");
  //     }

  //     transaction.approvedBy = userId;
  //     transaction.adminApproval = status;
  //     transaction.reference = withdrawalResponse.data.reference;

  //     transaction.save();

  //     return ApiSuccess.ok("Withdrawal request approved ", transaction);
  //   }

  //   static async handlePaystackWebhook(event: any) {
  //     const { event: eventType, data } = event;

  //     if (!data || !data.reference) {
  //       throw ApiError.badRequest("Invalid webhook payload");
  //     }

  //     const transaction = await Transaction.findOne({
  //       reference: data.reference,
  //     });

  //     if (!transaction) {
  //       throw ApiError.notFound("Transaction not found");
  //     }

  //     transaction.reference = data.reference;

  //     await transaction.save();

  //     // Prevent duplicate updates
  //     if (
  //       transaction.status === "successful" ||
  //       transaction.status === "failed"
  //     ) {
  //       return ApiSuccess.ok("Transaction already processed", transaction);
  //     }

  //     // console.log(`Paystack Webhook Event: ${eventType}`, data);

  //     switch (eventType) {
  //       case "transfer.success":
  //         transaction.status = "successful";
  //         break;

  //       case "transfer.failed":
  //       case "transfer.reversed":
  //         transaction.status = "failed";
  //         const user = await authService.findUserByIdOrEmail(
  //           transaction.user._id
  //         );
  //         user.balance += transaction.amount;
  //         await user.save();
  //         break;

  //       default:
  //         return ApiSuccess.ok("Webhook received but no action taken");
  //     }

  //     await transaction.save();
  //     return ApiSuccess.ok(
  //       `Transaction updated: ${transaction.status}`,
  //       transaction
  //     );
  //   }
}

export const transactionService = new TransactionService();
