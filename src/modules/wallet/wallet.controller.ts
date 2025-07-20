import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
import { WalletService } from "./wallet.service.js";

export class WalletController {
  // Controller to withdraw funds from the user's wallet
  static async withdrawFromWallet(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { amount } = req.body;
    const result = await WalletService.withdrawFromWallet(userId, amount);
    res.status(200).json(result);
  }

  // Controller to update wallet details
  static async updateUserWallet(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const walletDetails = req.body;
    const result = await WalletService.updateWallet(userId, walletDetails);
    res.status(200).json(result);
  }

  // Controller to retrieve wallet details
  static async getUserWallet(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await WalletService.getWallet(userId);
    res.status(200).json(result);
  }

  // Controller to retrieve available banks
  static async getAllBanks(req: Request, res: Response) {
    const result = await WalletService.getAllBanks();
    res.status(200).json(result);
  }

  // Admin
  // Controller to get all wallets (admin/reporting)
  static async getAllWallets(req: Request, res: Response) {
    const query = req.query;
    const result = await WalletService.getAllWallets(query);
    res.status(200).json(result);
  }

  // Controller to get user wallet by admin
  static async getUserWalletByAdmin(req: Request, res: Response) {
    const { userId } = req.params;
    const result = await WalletService.getUserWalletByAdmin(userId as string);
    res.status(200).json(result);
  }

  // Block a wallet
  static async blockUserWallet(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await WalletService.blockUserWallet(userId);
    res.status(200).json(result);
  }

  // Unblock a wallet
  static async unBlockUserWallet(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await WalletService.unBlockUserWallet(userId);
    res.status(200).json(result);
  }
}
