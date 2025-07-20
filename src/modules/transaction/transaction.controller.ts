import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
import { TransactionService } from "./transaction.service.js";

export class TransactionController {
  static async getUserTransactions(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const query = req.query;
    const result = await TransactionService.getUserTransactions(userId, query);
    res.status(200).json(result);
  }

  // Controller to get all transactions (admin/reporting)
  static async getAllTransactions(req: Request, res: Response) {
    const query = req.query;
    const result = await TransactionService.getAllTransactions(query);
    res.status(200).json(result);
  }

  // Controller to get a single transaction by ID
  static async getTransactionById(req: Request, res: Response) {
    const { transactionId } = req.params;
    const result = await TransactionService.getTransaction(
      transactionId as string
    );
    res.status(200).json(result);
  }
}
