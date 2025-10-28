import { z } from "zod";

export class LandlordRatingSchemas {
  static createLandlordRatingSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
    tenantId: z
      .string()
      .min(1, "Tenant id is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid tenant id"),
  });

  static updateLandlordRatingSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
    tenantId: z
      .string()
      .min(1, "Tenant id is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid tenant id"),
  });
  static idParams(paramName: string, paramLabel: string) {
    return z.object({
      [paramName]: z
        .string()
        .min(1, `${paramLabel} is required`)
        .regex(/^[0-9a-fA-F]{24}$/, `Invalid ${paramLabel}`),
    });
  }
}
