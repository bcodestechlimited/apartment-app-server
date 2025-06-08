import type { NextFunction, Request, Response } from "express";
import { array, z } from "zod";
import { ApiError } from "../../utils/responseHandler";
import type { FileArray, UploadedFile } from "express-fileupload";

export class AuthSchemas {
  static register = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      password: z
        .string({ required_error: "Password is required" })
        .min(5, "Password must be at least 5 characters long"),
    })
    .strict();

  static update = z
    .object({
      email: z
        .string()
        .email("Please provide a valid email address")
        .optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phoneNumber: z.string().optional(),
      roles: z
        .array(z.string())
        .nonempty("Please provide at least one role")
        .optional(),
      preferences: z
        .array(z.string())
        .nonempty("Please provide at least one preference")
        .optional(),
      // preferences: z
      //   .string()
      //   .refine(
      //     (val) => {
      //       try {
      //         const parsed = JSON.parse(val);
      //         console.log({ parsed });

      //         return true;
      //       } catch {
      //         return false;
      //       }
      //     },
      //     {
      //       message: "Preferences must be a valid JSON string",
      //     }
      //   )
      //   .optional(),
    })
    .strict();

  static login = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      password: z
        .string({ required_error: "Password is required" })
        .min(5, "Password must be at least 5 characters long"),
    })
    .strict();

  static verifyOTP = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      otp: z
        .string({ required_error: "otp is required" })
        .min(4, "otp must be at least 5 characters long"),
    })
    .strict();

  static sendOTP = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
    })
    .strict();

  static forgotPassword = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
    })
    .strict();

  static resetPassword = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      otp: z
        .string({ required_error: "otp is required" })
        .min(4, "otp must be at least 4 characters long"),
      password: z
        .string({ required_error: "Password is required" })
        .min(5, "Password must be at least 5 characters long"),
    })
    .strict();

  static validateFiles = (req: Request, res: Response, next: NextFunction) => {
    const documents = req.files?.documents as UploadedFile[] | undefined;
    const avatar = req.files?.avatar as UploadedFile | undefined;

    console.log({ documents, avatar });
    
    if (!documents && !avatar) {
      return next();
    }

    // Validate files are present
    if (!documents || !avatar) {
      return next();
    }

    // Optional: Validate each file is an image or a document
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/plain",
    ];

    for (const document of documents) {
      if (!allowedMimeTypes.includes(document.mimetype)) {
        return next(
          ApiError.badRequest(
            `Invalid document file type: ${document.mimetype}`
          )
        );
      }
    }

    // Optional: Validate each file is an image or a document
    const allowedAvatarMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedAvatarMimeTypes.includes(avatar.mimetype)) {
      return next(
        ApiError.badRequest(`Invalid avatar file type: ${avatar.mimetype}`)
      );
    }

    next();
  };
}
