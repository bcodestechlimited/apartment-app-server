import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";
import type { UploadedFile } from "express-fileupload";

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
}
