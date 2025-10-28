import { z } from "zod";

export class PropertyRatingSchemas {
  static createPropertyRatingSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
    propertyId: z
      .string()
      .min(1, "Property id is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid property id"),
  });
  static updatePropertyRatingSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
    propertyId: z
      .string()
      .min(1, "Property id is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid property id"),
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
