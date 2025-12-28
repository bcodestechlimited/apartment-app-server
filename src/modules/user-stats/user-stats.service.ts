import type { Types } from "mongoose";
import UserStats from "./user-stats.model";

// user-stats.service.ts
export class UserStatsService {
  static async updateStats(userId: string | Types.ObjectId, update: any) {
    return await UserStats.findOneAndUpdate(
      { user: userId },
      update,
      { upsert: true, new: true } // Creates the document if it doesn't exist
    );
  }
}
