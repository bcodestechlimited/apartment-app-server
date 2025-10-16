import type { NextFunction, Request, Response } from "express";
import * as z from "zod";
import { ApiError } from "../../utils/responseHandler";
import type { FileArray, UploadedFile } from "express-fileupload";

class AuthSchemas {
  register = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      password: z
        .string({ required_error: "Password is required" })
        .min(5, "Password must be at least 5 characters long"),
    })
    .strict();

  update = z
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

  login = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      password: z
        .string({ required_error: "Password is required" })
        .min(5, "Password must be at least 5 characters long"),
    })
    .strict();

  verifyOTP = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      otp: z
        .string({ required_error: "otp is required" })
        .min(4, "otp must be at least 5 characters long"),
    })
    .strict();

  sendOTP = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
    })
    .strict();

  forgotPassword = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
    })
    .strict();

  resetPassword = z
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

  validateFiles = (req: Request, res: Response, next: NextFunction) => {
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

  updatePersonalInfo = z
    .object({
      firstName: z
        .string({ required_error: "First name is required" })
        .min(2, "First name must be at least 2 characters"),
      lastName: z
        .string({ required_error: "Last name is required" })
        .min(2, "Last name must be at least 2 characters"),
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      phoneNumber: z
        .string({ required_error: "Phone number is required" })
        .regex(
          /^(0)(7|8|9){1}(0|1){1}[0-9]{8}$/,
          "Please provide a valid Nigerian phone number"
        ),
      gender: z.enum(["male", "female", "other"], {
        required_error: "Gender is required",
      }),
      dob: z
        .union([z.date(), z.string()])
        .refine(
          (val) => {
            const date = val instanceof Date ? val : new Date(val);
            return date <= new Date();
          },
          { message: "Date of birth cannot be in the future" }
        )
        .optional(),
      address: z.string({ required_error: "Address is required" }),
      state: z.string({ required_error: "State is required" }),
      city: z.string({ required_error: "City is required" }),
    })
    .strict();

  updateEmployment = z
    .object({
      employmentStatus: z.string({ required_error: "Job title is required" }),
      companyName: z.string({ required_error: "Employer is required" }),
      jobTitle: z.date({ required_error: "Start date is required" }),
      monthlyIncome: z.date({ required_error: "End date is required" }),
      companyAddress: z.string({ required_error: "Description is required" }),
    })
    .strict();

  updateNextOfKin = z
    .object({
      firstName: z
        .string({ required_error: "First name is required" })
        .email("Please provide a valid email address"),
      lastName: z
        .string({ required_error: "Last name is required" })
        .email("Please provide a valid email address"),
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      phoneNumber: z
        .string({ required_error: "Phone number is required" })
        .regex(
          /^(0)(7|8|9){1}(0|1){1}[0-9]{8}$/,
          "Please provide a valid Nigerian phone number"
        ),

      relationship: z.string({ required_error: "City is required" }),
    })
    .strict();

  updateGuarantor = z
    .object({
      firstName: z
        .string({ required_error: "First name is required" })
        .email("Please provide a valid email address"),
      lastName: z
        .string({ required_error: "Last name is required" })
        .email("Please provide a valid email address"),
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      phoneNumber: z
        .string({ required_error: "Phone number is required" })
        .regex(
          /^(0)(7|8|9){1}(0|1){1}[0-9]{8}$/,
          "Please provide a valid Nigerian phone number"
        ),

      relationship: z.string({ required_error: "City is required" }),
    })
    .strict();

  updateNotification = z
    .object({
      bookingUpdates: z.boolean({ required_error: "Notification is required" }),
      newsDeals: z.boolean({ required_error: "Notification is required" }),
      monthlyTips: z.boolean({ required_error: "Notification is required" }),
    })
    .strict();
}

export const authSchemas = new AuthSchemas();
