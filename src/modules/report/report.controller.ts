import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface";
import { ReportService } from "./report.service";
import type { IQueryParams } from "@/shared/interfaces/query.interface";
import type { ICreateReport } from "./report.interface";

export class ReportController {
  static async createReport(req: Request, res: Response) {
    const payload = req.body as ICreateReport;
    console.log({ payload });
    const { userId } = req.user as AuthenticatedUser;
    const result = await ReportService.createReport(payload, userId);
    res.status(201).json(result);
  }

  static async getReports(req: Request, res: Response) {
    const query = req.query as IQueryParams;
    const result = await ReportService.getReports(query);
    res.status(200).json(result);
  }

  static async getReport(req: Request, res: Response) {
    const { reportedUser } = req.params;
    const query = req.query as IQueryParams;
    const result = await ReportService.getReport(reportedUser as string, query);
    res.status(200).json(result);
  }
}
