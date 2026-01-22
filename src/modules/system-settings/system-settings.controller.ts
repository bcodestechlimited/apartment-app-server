import type { Request, Response } from "express";
import { SystemSettingService } from "./system-settings.service";
import type { IUpdateSystemSetting } from "./system-settings.interface";

export class SystemSettingsController {
  static async getSystemSettings(req: Request, res: Response) {
    const result = await SystemSettingService.getSettings();
    res.status(200).json(result);
  }
  static async updatePlatformFee(req: Request, res: Response) {
    const { newPercentage } = req.body;
    const result = await SystemSettingService.updatePlatformFee(newPercentage);
    res.status(200).json(result);
  }

  static async updateSystemSettings(req: Request, res: Response) {
    const data = req.body as IUpdateSystemSetting;
    const result = await SystemSettingService.updateSystemSettings(data);
    res.status(200).json(result);
  }
}
