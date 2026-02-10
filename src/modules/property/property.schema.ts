import { z } from "zod";
import { PropertyType, PricingModel } from "./property.interface";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/responseHandler";
import type { UploadedFile } from "express-fileupload";

export class PropertySchemas {
  static createPropertySchema = z
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
      numberOfBedrooms: z
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
        .string({ required_error: "Seating capacity is required" })
        .refine(
          (val) => {
            const parsed = Number.parseInt(val);
            return Number.isNaN(parsed) ? false : parsed >= 1;
          },
          {
            message:
              "Seating capacity must be a valid number greater than or equal to 1",
          },
        )
        .transform((val, ctx) => {
          const parsed = Number.parseInt(val);
          return parsed;
        })
        .optional(),

      // --- NEW VALIDATION: isEnsuite ---
      isEnsuite: z
        .string()
        .optional()
        .transform((val) => val === "true"),

      // --- NEW VALIDATION: otherFees ---
      otherFees: z
        .any()
        .optional()
        .transform((val, ctx) => {
          if (typeof val === "string") {
            try {
              const parsed = JSON.parse(val);
              if (!Array.isArray(parsed)) return [];
              return parsed;
            } catch {
              return [];
            }
          }
          return val;
        })
        .pipe(
          z
            .array(
              z.object({
                name: z.string().min(1, "Fee name is required"),
                amount: z.coerce.number().min(0, "Amount must be positive"), // Use coerce to handle strings
              }),
            )
            .optional(),
        ),

      pictures: z
        .array(z.string().url("Invalid image URL"))
        .min(3, "At least 3 pictures are required")
        .max(10, "Maximum of 10 pictures allowed"),

      amenities: z
        .any()
        .transform((val, ctx) => {
          if (typeof val === "string") {
            try {
              const parsed = JSON.parse(val);

              if (!Array.isArray(parsed)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Amenities must be a JSON array",
                });
                return z.NEVER;
              }

              const isStringArray = parsed.every((v) => typeof v === "string");

              if (!isStringArray) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Amenities must be a JSON array of strings",
                });
                return z.NEVER;
              }

              return parsed;
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
          z.array(z.string()).nonempty("Please provide at least one amenity"),
        ),
      facilities: z
        .any()
        .transform((val, ctx) => {
          if (typeof val === "string") {
            try {
              const parsed = JSON.parse(val);

              if (!Array.isArray(parsed)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Facilities must be a JSON array",
                });
                return z.NEVER;
              }

              const isStringArray = parsed.every((v) => typeof v === "string");

              if (!isStringArray) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Facilities must be a JSON array of strings",
                });
                return z.NEVER;
              }

              return parsed;
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
          z.array(z.string()).nonempty("Please provide at least one facility"),
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
        if (!data.numberOfBedrooms) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Number of rooms is required for non-workspace properties",
            path: ["numberOfBedRooms"],
          });
        }
      }
    });

  static updatePropertySchema = z.object({
    address: z
      .string({ required_error: "Address is required" })
      .min(10, "Address must be at least 10 characters long"),
    state: z.string({ required_error: "State is required" }),
    // .min(10, "State must be at least 10 characters long"),
    lga: z.string({ required_error: "LGA is required" }),
    // .min(5, "LGA must be at least 10 characters long"),
    numberOfBedrooms: z
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

    pricingModel: z.nativeEnum(PricingModel).optional(),
    seatingCapacity: z
      .number()
      .min(1, "Seating capacity must be at least 1")
      .optional(),

    isEnsuite: z
      .string()
      .optional()
      .transform((val) => val === "true"),

    otherFees: z
      .any()
      .optional()
      .transform((val, ctx) => {
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return val;
      })
      .pipe(
        z
          .array(
            z.object({
              name: z.string().min(1, "Fee name is required"),
              amount: z.coerce.number().min(0, "Amount must be positive"),
            }),
          )
          .optional(),
      ),

    amenities: z
      .any()
      .optional()
      .transform((val, ctx) => {
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [val];
          } catch {
            return [val];
          }
        }
        return val;
      })
      .pipe(z.array(z.string()).optional()),
    facilities: z
      .any()
      .optional()
      .transform((val, ctx) => {
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [val];
          } catch {
            return [val];
          }
        }
        return val;
      })
      .pipe(z.array(z.string()).optional()),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters long")
      .optional(),
    type: z.nativeEnum(PropertyType).optional(),
    existingPictures: z
      .any()
      .optional()
      .transform((val, ctx) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid JSON format for existingPictures",
            });
            return z.NEVER;
          }
        }
        if (Array.isArray(val)) {
          return val;
        }
        return val;
      })
      .pipe(z.array(z.string()).optional()),
  });

  static validateImages = (req: Request, res: Response, next: NextFunction) => {
    if (!req.files) {
      throw ApiError.badRequest("Please upload at lease three images");
    }

    const pictures = req.files["pictures"];

    // Validate files are present
    if (!pictures || !Array.isArray(pictures)) {
      throw ApiError.badRequest("Please upload at least three images");
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

  static validateUpdateImages = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.files) {
      return next();
    }

    const newPictures = req.files as { newPictures: UploadedFile[] };

    // console.log({ newPictures });

    // Validate files are present
    if (!newPictures || !Array.isArray(newPictures)) {
      return next();
    }

    // Optional: Validate each file is an image
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const picture of newPictures) {
      if (!allowedMimeTypes.includes(picture.mimetype)) {
        throw ApiError.badRequest(`Invalid file type: ${picture.mimetype})`);
      }
    }

    next();
  };
}
