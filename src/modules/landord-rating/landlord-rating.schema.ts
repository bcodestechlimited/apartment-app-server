import { z } from "zod";

export class LandlordRatingSchema {
  static createLandlordRatingSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().max(1000).optional(),
    landlordId: z
      .string()
      .min(1, "Landlord id is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid landlord id"),
  });

  static updateLandlordRatingSchema = z.object({
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
