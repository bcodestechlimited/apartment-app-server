import { z } from "zod";

export class TenantRatingSchema {
  static createTenantRatingSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
    landlordId: z
      .string()
      .min(1, "Landlord id is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid landlord id"),
  });

  static updateTenantRatingSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
    landlordId: z
      .string()
      .min(1, "Landlord id is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid landlord id"),
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
