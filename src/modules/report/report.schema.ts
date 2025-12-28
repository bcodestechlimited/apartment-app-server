import { z } from "zod";

export class ReportSchema {
  static createReportSchema = z.object({
    reporter: z.string().min(1, "Reporter ID is required"),
    reportedUser: z.string().min(1, "Reported User ID is required"),
    reason: z.string().min(1, "Reason is required"),
    description: z.string().optional(),
  });

  static updateReportStatusSchema = z.object({
    status: z.enum(["pending", "reviewed", "resolved", "dismissed"], {
      required_error: "Status is required",
    }),
  });
}
