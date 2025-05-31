import { z } from "zod";
import { PropertyType, PricingModel } from "./property.interface";

export class PropertySchemas {
  static create = z
    .object({
      numberOfRooms: z
        .number({ required_error: "Number of rooms is required" })
        .min(1, "There must be at least one room")
        .optional(),
      availability: z
        .array(z.string(), {
          invalid_type_error: "Availability must be an array of strings",
        })
        .nonempty("Please provide at least one availability time slot")
        .optional(),
      pricingModel: z
        .nativeEnum(PricingModel, {
          // invalid_type_error: "Invalid pricing model",
          // required_error: "Pricing model is required",
          errorMap: (issue, ctx) => {
            return { message: "Invalid pricing model" };
          },
        })
        .optional(),
      seatingCapacity: z
        .number({ required_error: "Seating capacity is required" })
        .min(1, "Seating capacity must be at least 1")
        .optional(),
      amenities: z
        .array(z.string())
        .nonempty("Please provide at least one amenity"),
      description: z
        .string({ required_error: "Description is required" })
        .min(10, "Description must be at least 10 characters long"),
      type: z.nativeEnum(PropertyType, {
        // required_error: "Property type is required",
        // invalid_type_error: "Invalid property type",
        errorMap: (issue, ctx) => {
          return { message: "Invalid property type" };
        },
      }),
      pictures: z
        .array(z.string().url("Each picture must be a valid URL"))
        .nonempty("Please provide at least one picture"),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (data.type === PropertyType.CO_WORKING_SPACE) {
        if (!data.availability || data.availability.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Availability is required for workspaces",
            path: ["availability"],
          });
        }
        if (!data.pricingModel) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Pricing model is required for workspaces",
            path: ["pricingModel"],
          });
        }
        if (!data.seatingCapacity) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Seating capacity is required for workspaces",
            path: ["seatingCapacity"],
          });
        }
      } else {
        if (data.numberOfRooms == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Number of rooms is required for non-workspace properties",
            path: ["numberOfRooms"],
          });
        }
      }
    });

  static update = z
    .object({
      numberOfRooms: z
        .number()
        .min(1, "There must be at least one room")
        .optional(),
      availability: z.array(z.string()).optional(),
      pricingModel: z.nativeEnum(PricingModel).optional(),
      seatingCapacity: z
        .number()
        .min(1, "Seating capacity must be at least 1")
        .optional(),
      amenities: z
        .array(z.string())
        .nonempty("Please provide at least one amenity")
        .optional(),
      description: z
        .string()
        .min(10, "Description must be at least 10 characters long")
        .optional(),
      type: z.nativeEnum(PropertyType).optional(),
      pictures: z
        .array(z.string().url("Each picture must be a valid URL"))
        .nonempty("Please provide at least one picture")
        .optional(),
    })
    .strict();
}
