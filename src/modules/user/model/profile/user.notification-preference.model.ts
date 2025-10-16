import { Schema, model, Types } from "mongoose";
import type { INotificationPreference } from "../../user.interface";

const notificationPreferenceSchema: Schema<INotificationPreference> =
  new Schema(
    {
      user: { type: Types.ObjectId, ref: "User", required: true },
      bookingUpdates: { type: Boolean, default: true },
      newsDeals: { type: Boolean, default: false },
      monthlyTips: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

export const NotificationPreference = model(
  "NotificationPreference",
  notificationPreferenceSchema
);
