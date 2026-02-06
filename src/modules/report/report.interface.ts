import type { Document, ObjectId } from "mongoose";

export interface IReport extends Document {
  _id: string;
  reporter: ObjectId | string;
  reportedUser: ObjectId | string;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateReport {
  //   reporter: ObjectId | string;
  reportedUser: ObjectId | string;
  reason: string;
  description?: string;
}

export interface IUpdateReportStatus {
  status: "pending" | "reviewed" | "resolved" | "dismissed";
}
