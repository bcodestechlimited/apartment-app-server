import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
import { TenantService } from "./tenant.service.js";

export class TenantController {
  static async getAllTenants(req: Request, res: Response) {
    const query = req.query;
    const result = await TenantService.getAllTenants(query);
    res.status(201).json(result);
  }

  static async getLandlordTenants(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const query = req.query;
    const result = await TenantService.getLandlordTenants(userId, query);
    res.status(201).json(result);
  }

  static async getTenantById(req: Request, res: Response) {
    const { tenantId } = req.params;
    const result = await TenantService.getTenantById(tenantId as string);
    res.status(201).json(result);
  }
}
