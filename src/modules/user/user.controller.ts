import type { Request, Response } from "express";
import UserService from "./user.service.js";

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    const query = req.query;
    const result = await UserService.getAllUsers(query);
    res.status(200).json(result);
  }

  // Controller to get all transactions (admin/reporting)
  static getUserById(req: Request, res: Response) {
    const { userId } = req.params;
    const result = UserService.getUserById(userId as string);
    res.status(200).json(result);
  }

  static async getTenantsForAdmin(req: Request, res: Response) {
    const query = req.query;
    const result = await UserService.getTenantsForAdmin(query);
    res.status(200).json(result);
  }

  static async getTenantForAdmin(req: Request, res: Response) {
    const { tenantId } = req.params;
    const result = await UserService.getTenantForAdmin(tenantId as string);
    res.status(200).json(result);
  }

  static async getLandlordsForAdmin(req: Request, res: Response) {
    const query = req.query;
    const result = await UserService.getLandlordsForAdmin(query);
    res.status(200).json(result);
  }

  static async getLandlordForAdmin(req: Request, res: Response) {
    const { landlordId } = req.params;
    const result = await UserService.getLandlordForAdmin(landlordId as string);
    res.status(200).json(result);
  }

  static async getUserDocuments(req: Request, res: Response) {
    const { userId } = req.params;
    const result = await UserService.getUserDocuments(userId as string);
    res.status(200).json(result);
  }
}
