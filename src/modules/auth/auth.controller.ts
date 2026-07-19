import type { Request, Response } from "express";
import type { AuthenticatedUser, IUser } from "../user/user.interface.js";
import type { UploadedFile } from "express-fileupload";
import { CLIENT_BASE_URL, clientURLs } from "@/utils/clientURL.js";
import type { IQueryParams } from "@/shared/interfaces/query.interface.js";
import type { Types } from "mongoose";
import { authService } from "./auth.service.js";
import { env } from "@/config/env.config.js";

class AuthController {
  // Register user
  async register(req: Request, res: Response) {
    const userData = req.body;
    const result = await authService.register(userData);
    res.status(201).json(result);
  }

  // Login user
  async login(req: Request, res: Response) {
    const userData = req.body;
    const result = await authService.login(userData);
    const { token } = result.data;

    const isProdOrStaging =
      env.NODE_ENV === "production" || env.NODE_ENV === "staging";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProdOrStaging, // see note below re: local dev
      sameSite: isProdOrStaging ? "none" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: "/",
      domain: isProdOrStaging ? ".havenlease.com" : undefined,
    });

    result.data.token = undefined;

    res.status(200).json(result);
  }

  // Generate Goolge Link
  async generateGoogleLoginLink(req: Request, res: Response) {
    const { role, redirect } = req.query;
    const result = await authService.loginWithGoogle({
      role: role as string,
      redirect: redirect as string,
    });
    res.status(200).json(result);
  }

  // Google Login
  async googleCallback(req: Request, res: Response) {
    const query = req.query;
    const result = await authService.handleGoogleCallback(query);
    const { token, user, redirectPath, error } = result.data as {
      token: string;
      user: IUser;
      redirectPath: string;
      error: string;
    };

    if (user && !user.isActive) {
      return res.redirect(
        `${clientURLs.loginURL}?login-error=account_blocked&provider=google`,
      );
    }
    console.log("redirectPath", redirectPath);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    result.data.token = undefined;

    // if (!user.onboarded) {
    //   return res.redirect(clientURLs.onboarding.roleSelectionURL);
    // }

    if (error) {
      return res.redirect(clientURLs.loginURL);
    }

    if (user.roles.includes("admin")) {
      if (redirectPath && redirectPath.startsWith("/properties")) {
        return res.redirect(clientURLs.admin.dashboardURL + redirectPath);
      }
      if (redirectPath && redirectPath.includes("/dashboard/admin")) {
        return res.redirect(CLIENT_BASE_URL + redirectPath);
      }
      return res.redirect(clientURLs.admin.dashboardURL);
    }
    if (user.roles.includes("landlord")) {
      if (redirectPath && redirectPath.startsWith("/properties")) {
        return res.redirect(clientURLs.landlord.dashboardURL + redirectPath);
      }
      if (redirectPath && redirectPath.includes("/dashboard/landlord")) {
        return res.redirect(CLIENT_BASE_URL + redirectPath);
      }
      return res.redirect(clientURLs.landlord.dashboardURL);
    }
    if (user.roles.includes("tenant")) {
      if (redirectPath && redirectPath.startsWith("/properties")) {
        return res.redirect(clientURLs.tenant.dashboardURL + redirectPath);
      }

      if (redirectPath && redirectPath.includes("/dashboard/landlord")) {
        return res.redirect(clientURLs.tenant.dashboardURL);
      }

      if (redirectPath && redirectPath.includes("/dashboard/admin")) {
        return res.redirect(clientURLs.tenant.dashboardURL);
      }

      if (redirectPath && redirectPath.includes("/dashboard")) {
        return res.redirect(CLIENT_BASE_URL + redirectPath);
      }

      return res.redirect(clientURLs.tenant.dashboardURL);
    }

    if (user.roles.includes("user")) {
      return res.redirect(clientURLs.onboarding.roleSelectionURL);
    }

    return res.redirect(clientURLs.landingPageURL);
  }

  async logout(req: Request, res: Response) {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({
      success: true,
      status_code: 200,
      message: "Logout successful",
      data: null,
    });
  }

  // src/modules/auth/auth.controller.ts

  async completeOnboarding(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { role } = req.body;

    const { user, token } = await authService.updateUserRoleAndOnboard(
      userId,
      role,
    );

    const isProdOrStaging =
      env.NODE_ENV === "production" || env.NODE_ENV === "staging";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProdOrStaging, // see note below re: local dev
      sameSite: isProdOrStaging ? "none" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: "/",
      domain: isProdOrStaging ? ".havenlease.com" : undefined,
    });

    res.status(200).json({ success: true, data: { user, token } });
  }

  // Get user data
  async getUser(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await authService.getUser(userId);
    res.status(200).json(result);
  }

  //
  async updateUser(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const files = req.files as
      { document?: UploadedFile; avatar?: UploadedFile } | undefined;
    const result = await authService.updateUser(userId, userData, files);
    res.status(200).json(result);
  }

  // Send OTP
  async sendOTP(req: Request, res: Response) {
    const { email } = req.body;
    const result = await authService.sendOTP({ email });
    res.status(200).json(result);
  }

  // Verify OTP
  async verifyOTP(req: Request, res: Response) {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP({ email, otp });
    res.status(200).json(result);
  }

  // Forgot password
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const result = await authService.forgotPassword({ email });
    res.status(200).json(result);
  }

  // Reset password
  async resetPassword(req: Request, res: Response) {
    const { email, otp, password } = req.body;
    const result = await authService.resetPassword({ email, otp, password });
    res.status(200).json(result);
  }

  // Profile - Personal Info
  async getPersonalInfo(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await authService.getUserPersonalInfo(userId);
    res.status(200).json(result);
  }
  async updatePersonalInfo(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;

    const result = await authService.updateUserPersonalInfo(userId, userData);
    res.status(200).json(result);
  }

  // Profile - Employment
  async getUserEmployment(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await authService.getUserEmployment(userId);
    res.status(200).json(result);
  }
  async updateUserEmployment(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const result = await authService.updateUserEmployment(userId, userData);
    res.status(200).json(result);
  }

  // Profile - Documents
  async getUserDocuments(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await authService.getUserDocuments(userId);
    res.status(200).json(result);
  }

  //  async getUserDocument(req: Request, res: Response) {
  //   const { UserId } = req.params;
  //   const result = await authService.getUserDocument(UserId);
  //   res.status(200).json(result);
  // }

  async getAllUserDocuments(req: Request, res: Response) {
    const query = req.query as IQueryParams;
    const result = await authService.getAllUserDocuments(query);
    res.status(200).json(result);
  }

  async verifyUserDocument(req: Request, res: Response) {
    const { documentId } = req.params as unknown as {
      documentId: Types.ObjectId;
    };
    const result = await authService.verifyUserDocument(documentId);
    res.status(200).json(result);
  }

  async rejectUserDocument(req: Request, res: Response) {
    const { documentId } = req.params as unknown as {
      documentId: Types.ObjectId;
    };
    const result = await authService.rejectUserDocument(documentId);
    res.status(200).json(result);
  }

  async uploadUserDocument(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { document, name } = req.body;
    const result = await authService.uploadUserDocument(userId, document, name);
    res.status(200).json(result);
  }

  // Profile - Next Of Kin
  async getUserNextOfKin(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await authService.getUserNextOfKin(userId);
    res.status(200).json(result);
  }
  async updateUserNextOfKin(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const result = await authService.updateUserNextOfKin(userId, userData);
    res.status(200).json(result);
  }

  // Profile - Guarantor
  async getUserGuarantor(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await authService.getUserGuarantor(userId);
    res.status(200).json(result);
  }
  async updateUserGuarantor(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const userData = req.body;
    const result = await authService.updateUserGuarantor(userId, userData);
    res.status(200).json(result);
  }
}

export const authController = new AuthController();
