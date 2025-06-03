import { z } from "zod";
import { PropertyType, PricingModel } from "./property.interface";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/responseHandler";

export class PropertySchemas {
  static create = z
    .object({
      numberOfRooms: z
        .string({ required_error: "Number of rooms is required" })
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
        .any()
        .transform((val, ctx) => {
          if (typeof val === "string") {
            try {
              const parsed = JSON.parse(val);
              if (
                Array.isArray(parsed) &&
                parsed.every((v) => typeof v === "string")
              ) {
                return parsed;
              } else {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Amenities must be a JSON array of strings",
                });
                return z.NEVER;
              }
            } catch {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid JSON format for amenities",
              });
              return z.NEVER;
            }
          }

          return val;
        })
        .pipe(
          z.array(z.string()).nonempty("Please provide at least one amenity")
        ),

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
        .string()
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

  static validateImages = (req: Request, res: Response, next: NextFunction) => {
    if (!req.files) {
      throw ApiError.badRequest("Please upload at lease three images");
    }

    const pictures = req.files["pictures"];

    // console.log({ pictures });

    // Validate files are present
    if (!pictures || !Array.isArray(pictures)) {
      throw ApiError.badRequest("Pictures are required");
    }

    if (pictures.length <= 2) {
      throw ApiError.badRequest("Please upload at least three images");
    }

    // Optional: Validate each file is an image
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const picture of pictures) {
      if (!allowedMimeTypes.includes(picture.mimetype)) {
        throw ApiError.badRequest(`Invalid file type: ${picture.mimetype})`);
      }
    }

    next();
  };
}
