import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";

import { paginate } from "../../utils/paginate.js";
import type {
  createTransactionDTO,
  IProcessWithdrawal,
} from "./transaction.interface.js";
// import Transaction from "./transaction.model.js";
import type { ObjectId, PopulateOptions, Types } from "mongoose";
import type { IQueryParams } from "@/shared/interfaces/query.interface.js";
import Transaction from "./transaction.model.js";
import { PaymentService } from "@/services/payment.service.js";
import UserService from "../user/user.service.js";

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

  static async getPaymentOverview(query: IQueryParams) {
    const { page = 1, limit = 10, search, status, transactionType } = query;

    // 1. Calculate Global Stats using ONLY the Transaction collection
    const [revenueStats, payoutStats] = await Promise.all([
      // Sum successful payments (Income)
      Transaction.aggregate([
        {
          $match: {
            transactionType: "payment",
            status: "success",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Sum withdrawals grouped by status (Outgoings)
      Transaction.aggregate([
        { $match: { transactionType: "withdrawal" } },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    // Parse withdrawal results
    const pendingPayouts =
      payoutStats.find((p) => p._id === "pending")?.total || 0;
    const successfulPayouts =
      payoutStats.find((p) => p._id === "success")?.total || 0;

    // 2. Fetch Transactions for the table
    const filterQuery: any = {};
    if (status && status !== "all") filterQuery.status = status;
    if (transactionType && transactionType !== "all")
      filterQuery.transactionType = transactionType;
    if (search) filterQuery.reference = { $regex: search, $options: "i" };

    const { documents: transactions, pagination } = await paginate({
      model: Transaction,
      query: filterQuery,
      populateOptions: [
        { path: "user", select: "firstName lastName email roles" },
        { path: "approvedBy", select: "firstName lastName" },
      ],
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return ApiSuccess.ok("Payments retrieved", {
      transactions,
      stats: {
        // This will now equal 20,000 + 65,000 + 65,000 = 150,000
        totalRevenue: revenueStats[0]?.total || 0,
        pendingPayouts,
        successfulPayouts,
      },
      pagination,
    });
  }

  static async processWithdrawal(
    payload: IProcessWithdrawal,
    adminId: string | Types.ObjectId | ObjectId
  ) {
    const { transactionId, action, reason } = payload;
    console.log("Payload:", payload);
    const transaction = await Transaction.findById(transactionId).populate(
      "user"
    );
    console.log("Transaction found:", transaction);

    if (!transaction || transaction.adminApproval !== "pending") {
      throw new ApiError(400, "Invalid or already processed transaction");
    }

    // 2. Handle Rejection (No API call needed)
    if (action === "rejected") {
      transaction.adminApproval = "rejected";
      transaction.status = "failed";
      transaction.rejectionReason = reason;
      await transaction.save();
      return new ApiSuccess(200, "Withdrawal rejected successfully");
    }

    // 3. Handle Approval (Trigger Paystack via Payment Service)

    // Check if user has a recipient code
    if (!transaction.user.paystackRecipientCode) {
      throw new ApiError(
        400,
        "Recipient bank details not registered with provider"
      );
    }

    const transferData = {
      source: "balance",
      amount: Math.round(transaction.amount * 100), // Convert to kobo
      recipient: transaction.user.paystackRecipientCode,
      reason: `Withdrawal for ${transaction.user.firstName} ${transaction.user.lastName}`,
      reference: transaction.reference,
    };

    // Call the payment service method

    const paystackRes = await PaymentService.transferFunds(transferData);

    // 4. Update local state based on successful initiation
    if (paystackRes?.status) {
      transaction.adminApproval = "approved";
      transaction.status = "pending"; // Final status determined by webhook
      transaction.approvedBy = adminId as ObjectId;
      transaction.approvalDate = new Date();

      await transaction.save();

      return new ApiSuccess(
        200,
        "Transfer initiated successfully via Paystack"
      );
    }
    // else {
    //   throw new ApiError(500, "Paystack declined the transfer initiation");
    // }
  }

  static async updateTransactionStatus(
    reference: string,
    status: "success" | "failed",
    metadata?: { description?: string; reason?: string }
  ) {
    const transaction = await Transaction.findOne({ reference }).populate(
      "user"
    );

    if (!transaction) {
      throw ApiError.notFound(
        `Transaction with reference ${reference} not found`
      );
    }

    // Prevent duplicate processing if already in a final state
    if (
      transaction.status === "success" ||
      (transaction.status === "failed" &&
        transaction.transactionType !== "withdrawal")
    ) {
      return transaction;
    }

    // Update transaction details
    transaction.status = status;
    if (metadata?.description) transaction.description = metadata.description;
    if (metadata?.reason) transaction.rejectionReason = metadata.reason;

    // Handle Withdrawal Reversal Logic
    // If a withdrawal fails, we must return the money back to the user's "totalEarnings" or wallet balance
    if (status === "failed" && transaction.transactionType === "withdrawal") {
      const user = await UserService.findUserById(
        transaction.user._id as string
      );
      if (user) {
        // Revert the amount back to the user
        user.totalEarnings = (user.totalEarnings || 0) + transaction.amount;
        await user.save();
      }
    }

    await transaction.save();
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
