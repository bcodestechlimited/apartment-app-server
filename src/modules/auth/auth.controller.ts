import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import type { AuthenticatedUser, IUser } from "../user/user.interface.js";
import type { UploadedFile } from "express-fileupload";
import { clientURLs } from "@/utils/clientURL.js";

export class AuthController {
  // Register user
  static async register(req: Request, res: Response) {
    const userData = req.body;
    const result = await AuthService.register(userData);
    res.status(201).json(result);
  }

  // Login user
  static async login(req: Request, res: Response) {
    const userData = req.body;
    const result = await AuthService.login(userData);
    const { token } = result.data;

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    result.data.token = undefined;

    res.status(200).json(result);
  }

  // Generate Goolge Link
  static async generateGoogleLoginLink(req: Request, res: Response) {
    const result = await AuthService.loginWithGoogle();
    res.status(200).json(result);
  }

  // Google Login
  static async googleCallback(req: Request, res: Response) {
    const query = req.query;
    const result = await AuthService.handleGoogleCallback(query);
    const { token, user } = result.data as { token: string; user: IUser };

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    result.data.token = undefined;

    if (!user.onboarded) {
      return res.redirect(clientURLs.onboarding.roleSelectionURL);
    }
    if (user.roles.includes("admin")) {
      return res.redirect(clientURLs.admin.dashboardURL);
    }
    if (user.roles.includes("landlord")) {
      return res.redirect(clientURLs.landlord.dashboardURL);
    }
    if (user.roles.includes("tenant")) {
      return res.redirect(clientURLs.tenant.dashboardURL);
    }

    return res.redirect(clientURLs.landingPageURL);
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({
      success: true,
      status_code: 200,
      message: "Logout successful",
      data: null,
    });
  }

  // Get user data
  static async getUser(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await AuthService.getUser(userId);
    res.status(200).json(result);
  }

  //
  static async updateUser(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const files = req.files as
      | { document?: UploadedFile; avatar?: UploadedFile }
      | undefined;
    const result = await AuthService.updateUser(userId, userData, files);
    res.status(200).json(result);
  }

  // Send OTP
  static async sendOTP(req: Request, res: Response) {
    const { email } = req.body;
    const result = await AuthService.sendOTP({ email });
    res.status(200).json(result);
  }

  // Verify OTP
  static async verifyOTP(req: Request, res: Response) {
    const { email, otp } = req.body;
    const result = await AuthService.verifyOTP({ email, otp });
    res.status(200).json(result);
  }

  // Forgot password
  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const result = await AuthService.forgotPassword({ email });
    res.status(200).json(result);
  }

  // Reset password
  static async resetPassword(req: Request, res: Response) {
    const { email, otp, password } = req.body;
    const result = await AuthService.resetPassword({ email, otp, password });
    res.status(200).json(result);
  }

  // Profile - Personal Info
  static async getPersonalInfo(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await AuthService.getUserPersonalInfo(userId);
    res.status(200).json(result);
  }
  static async updatePersonalInfo(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const result = await AuthService.updateUserPersonalInfo(userId, userData);
    res.status(200).json(result);
  }

  // Profile - Employment
  static async getUserEmployment(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await AuthService.getUserEmployment(userId);
    res.status(200).json(result);
  }
  static async updateUserEmployment(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const result = await AuthService.updateUserEmployment(userId, userData);
    res.status(200).json(result);
  }

  // Profile - Documents
  static async getUserDocuments(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await AuthService.getUserDocuments(userId);
    res.status(200).json(result);
  }
  static async uploadUserDocument(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const files = req.files;
    const result = await AuthService.uploadUserDocument(userId, files);
    res.status(200).json(result);
  }

  // Profile - Next Of Kin
  static async getUserNextOfKin(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await AuthService.getUserNextOfKin(userId);
    res.status(200).json(result);
  }
  static async updateUserNextOfKin(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const result = await AuthService.updateUserNextOfKin(userId, userData);
    res.status(200).json(result);
  }

  // Profile - Guarantor
  static async getUserGuarantor(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await AuthService.getUserGuarantor(userId);
    res.status(200).json(result);
  }
  static async updateUserGuarantor(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const result = await AuthService.updateUserGuarantor(userId, userData);
    res.status(200).json(result);
  }
}
