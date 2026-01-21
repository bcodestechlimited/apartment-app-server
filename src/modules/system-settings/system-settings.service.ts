import type { IUpdateSystemSetting } from "./system-settings.interface";
import SystemSetting from "./system-settings.model";

export class SystemSettingService {
  // Get the current settings (create default if it doesn't exist)
  static async getSettings() {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({ platformFeePercentage: 5 });
    }
    return settings;
  }

  // Admin updates the percentage
  static async updatePlatformFee(newPercentage: number) {
    const settings = await this.getSettings();
    settings.platformFeePercentage = newPercentage;
    await settings.save();
    return settings;
  }

  static async updateSystemSettings(data: IUpdateSystemSetting) {
    const settings = await this.getSettings();
    settings.platformFeePercentage = data.platformFeePercentage;
    await settings.save();
    return settings;
  }

  static async getPlatformFee() {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({ platformFeePercentage: 5 });
    }
    return settings.platformFeePercentage;
  }
}
