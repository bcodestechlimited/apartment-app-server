import { number, z } from "zod";
import { PropertyType, PricingModel } from "./property.interface";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/responseHandler";

export class PropertySchemas {
  static create = z
    .object({
      title: z
        .string({ required_error: "Title is required" })
        .min(10, "Title must be at least 10 characters long"),
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
      address: z
        .string({ required_error: "Address is required" })
        .min(10, "Address must be at least 10 characters long"),
      state: z.string({ required_error: "State is required" }),
      // .min(10, "State must be at least 10 characters long"),
      lga: z.string({ required_error: "LGA is required" }),
      // .min(5, "LGA must be at least 10 characters long"),
      numberOfBedRooms: z
        .string({ required_error: "Number of bedrooms is required" })
        .min(1, "There must be at least one room")
        .optional(),
      numberOfBathrooms: z
        .string({ required_error: "Number of bathrooms is required" })
        .min(1, "There must be at least one room")
        .optional(),
      price: z
        .string({ required_error: "Price is required" })
        .min(1, "Price must be at least 1")
        .optional(),
      availabilityDate: z
        .string({
          invalid_type_error: "Please provide a valid availability time slot",
        })
        .nonempty("Please provide at least one availability time slot")
        .optional(),
      pricingModel: z
        .nativeEnum(PricingModel, {
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
      facilities: z
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
                  message: "Facilities must be a JSON array of strings",
                });
                return z.NEVER;
              }
            } catch {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid JSON format for facilities",
              });
              return z.NEVER;
            }
          }

          return val;
        })
        .pipe(
          z.array(z.string()).nonempty("Please provide at least one facility")
        ),
    })
    // .strict()
    .superRefine((data, ctx) => {
      if (data.type === PropertyType.CO_WORKING_SPACE) {
        // if (!data.availabilityDate) {
        //   ctx.addIssue({
        //     code: z.ZodIssueCode.custom,
        //     message: "Availability is required for workspaces",
        //     path: ["availability"],
        //   });
        // }
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
        if (!data.numberOfBedRooms) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Number of rooms is required for non-workspace properties",
            path: ["numberOfBedRooms"],
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

    if (pictures.length <= 1) {
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
