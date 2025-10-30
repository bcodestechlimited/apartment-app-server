import OTP from "../otp/otp.model.js";
import type {
  LoginDTO,
  OTPData,
  RegisterDTO,
  ResetPasswordDTO,
} from "./auth.interface.js";
import UserService from "../user/user.service.js";
import { comparePassword, hashPassword } from "../../utils/validationUtils.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import { generateToken } from "../../config/token.js";
import type { ObjectId, Types } from "mongoose";
import agenda from "../../lib/agenda.js";
import type { updateUserDTO } from "../user/user.interface.js";
import type { UploadedFile } from "express-fileupload";
import { UploadService } from "../../services/upload.service.js";
import type { IQueryParams } from "@/shared/interfaces/query.interface.js";
import {
  generateGoogleAuthURL,
  getGoogleUserData,
} from "@/lib/google-oauth.js";

export class AuthService {
  static async register(userData: RegisterDTO) {
    const { email, roles } = userData;

    const user = await UserService.createUser({
      ...userData,
      provider: "local",
      roles: roles,
    });

    await user.save();
    user.password = undefined;

    agenda.now("send_otp_email", {
      email: user.email,
      username: user.firstName,
    });

    return ApiSuccess.created(
      `Registration successful. OTP will be sent to ${email} shortly.`,
      { user }
    );
  }

  static async login(userData: LoginDTO) {
    const { email, password } = userData;
    console.log({ userData });

    const user = await UserService.findUserByEmail(email);
    if (user.provider !== "local") {
      throw ApiError.conflict("Unauthorized");
    }
    console.log({ password, userPassword: user });
    await comparePassword(password, user.password as string);

    if (!user.isVerified) {
      throw ApiError.forbidden("Email Not Verified");
    }
    const token = generateToken({ userId: user._id, roles: user.roles });

    return ApiSuccess.ok("Login Successful", {
      user,
      token,
    });
  }

  static async loginWithGoogle() {
    const redirectURL = generateGoogleAuthURL();
    return ApiSuccess.ok("Login successful", { redirectURL });
  }

  static async handleGoogleCallback(query: IQueryParams) {
    const { code } = query;
    if (!code) {
      throw ApiError.badRequest("Code is required");
    }
    const googleUser = await getGoogleUserData(code as string);

    if (!googleUser || !googleUser.email) {
      throw ApiError.badRequest("Google user not found");
    }

    let user = await UserService.getUserOrNull(googleUser.email);

    if (!user) {
      const newUser = await UserService.createUser({
        email: googleUser.email,
        firstName: googleUser.given_name || "",
        lastName: googleUser.family_name || "",
        avatar: googleUser.picture || "",
        googleId: googleUser.id,
        provider: "google",
        isEmailVerified: true,
      });

      user = newUser;
    }

    const token = generateToken({ userId: user._id, roles: user.roles });

    return ApiSuccess.ok("Login successful", { user, token });
  }

  static async getUser(userId: Types.ObjectId) {
    const user = await UserService.findUserById(userId);
    user.password = undefined;
    return ApiSuccess.ok("User Retrieved Successfully", {
      user,
    });
  }
  static async updateUser(
    userId: Types.ObjectId,
    userData: Partial<updateUserDTO>,
    files?: { document?: UploadedFile; avatar?: UploadedFile }
  ) {
    const UpdatedUserData = {
      ...userData,
    };

    if (files && files.document) {
      const { document } = files;
      const { secure_url, resource_type } =
        await UploadService.uploadToCloudinary(document.tempFilePath);

      UpdatedUserData.document = {
        type: resource_type === "image" ? "image" : "file",
        url: secure_url as string,
      };
    }

    if (files && files.avatar) {
      const { secure_url } = await UploadService.uploadToCloudinary(
        files.avatar.tempFilePath
      );
      UpdatedUserData.avatar = secure_url as string;
    }

    console.log({ UpdatedUserData, files });

    const user = await UserService.updateUser(userId, UpdatedUserData);
    user.password = undefined;
    return ApiSuccess.ok("Profile Updated Successfully", {
      user,
    });
  }

  static async sendOTP({ email }: { email: string }) {
    const user = await UserService.findUserByEmail(email);
    if (user.isVerified) {
      return ApiSuccess.ok("User Already Verified");
    }

    agenda.now("send_otp_email", {
      email: user.email,
      username: user.firstName,
    });

    return ApiSuccess.ok(`OTP has been sent to ${email}`);
  }

  static async verifyOTP({ email, otp }: OTPData) {
    const user = await UserService.findUserByEmail(email);
    if (user.isVerified) {
      return ApiSuccess.ok("User Already Verified");
    }

    const otpExists = await OTP.findOne({ email, otp });
    if (!otpExists) {
      throw ApiError.notFound("Invalid or Expired OTP");
    }
    user.isVerified = true;
    await user.save();
    return ApiSuccess.ok("Email Verified");
  }

  static async forgotPassword({ email }: { email: string }) {
    const user = await UserService.findUserByEmail(email);
    agenda.now("send_otp_email", {
      email: user.email,
      username: user.firstName,
    });
    return ApiSuccess.ok(`OTP has been sent to ${user.email}`);
  }

  static async resetPassword({ email, otp, password }: ResetPasswordDTO) {
    const user = await UserService.findUserByEmail(email);
    const otpExists = await OTP.findOne({ email, otp });
    if (!otpExists) {
      throw ApiError.badRequest("Invalid or Expired OTP");
    }
    user.password = await hashPassword(password);
    await user.save();
    return ApiSuccess.ok("Password Updated");
  }

  //Profile
  static async getUserPersonalInfo(userId: Types.ObjectId) {
    const personalInfo = await UserService.getUserPersonalInfo(userId);
    return ApiSuccess.ok("Personal info retrieved successfully", {
      personalInfo,
    });
  }
  static async updateUserPersonalInfo(userId: Types.ObjectId, userData: any) {
    const personalInfo = await UserService.updateUserInformation(
      userId,
      userData
    );

    return ApiSuccess.ok("Personal Info Updated Successfully", {
      personalInfo,
    });
  }

  //Employment
  static async getUserEmployment(userId: Types.ObjectId) {
    const userEmployment = await UserService.getUserEmployment(userId);
    return ApiSuccess.ok("User employment retrieved successfully", {
      employment: userEmployment,
    });
  }

  static async updateUserEmployment(userId: Types.ObjectId, userData: any) {
    const userEmployment = await UserService.updateUserEmployment(
      userId,
      userData
    );

    return ApiSuccess.ok("User employment Updated Successfully", {
      userEmployment,
    });
  }

  //Documents
  static async getUserDocuments(userId: Types.ObjectId) {
    const userDocuments = await UserService.getUserDocuments(userId);
    return ApiSuccess.ok("User documents retrieved successfully", {
      documents: userDocuments,
    });
  }

  static async uploadUserDocument(userId: Types.ObjectId, files: any) {
    const userEmployment = await UserService.uploadUserDocument(userId, files);

    return ApiSuccess.ok("User employment Updated Successfully", {
      userEmployment,
    });
  }

  //Next Of Kin
  static async getUserNextOfKin(userId: Types.ObjectId) {
    const nextOfKin = await UserService.getUserNextOfKin(userId);
    return ApiSuccess.ok("User next of kin retrieved successfully", {
      nextOfKin,
    });
  }

  static async updateUserNextOfKin(userId: Types.ObjectId, userData: any) {
    const nextOfKin = await UserService.updateUserNextOfKin(userId, userData);

    return ApiSuccess.ok("User next of kin Updated Successfully", {
      nextOfKin,
    });
  }

  //Guarantor
  static async getUserGuarantor(userId: Types.ObjectId) {
    const guarantor = await UserService.getUserGuarantor(userId);
    return ApiSuccess.ok("User guarantor retrieved successfully", {
      guarantor,
    });
  }

  static async updateUserGuarantor(userId: Types.ObjectId, userData: any) {
    const guarantor = await UserService.updateUserGuarantor(userId, userData);

    return ApiSuccess.ok("User guarantor Updated Successfully", {
      guarantor,
    });
  }

  static async updateUserDocuments(
    userId: Types.ObjectId,
    userData: Partial<updateUserDTO>,
    files?: { document?: UploadedFile; avatar?: UploadedFile }
  ) {
    const UpdatedUserData = {
      ...userData,
    };

    if (files && files.document) {
      const { document } = files;
      const { secure_url, resource_type } =
        await UploadService.uploadToCloudinary(document.tempFilePath);

      UpdatedUserData.document = {
        type: resource_type === "image" ? "image" : "file",
        url: secure_url as string,
      };
    }

    if (files && files.avatar) {
      const { secure_url } = await UploadService.uploadToCloudinary(
        files.avatar.tempFilePath
      );
      UpdatedUserData.avatar = secure_url as string;
    }

    console.log({ UpdatedUserData, files });

    const user = await UserService.updateUser(userId, UpdatedUserData);
    user.password = undefined;
    return ApiSuccess.ok("Profile Updated Successfully", {
      user,
    });
  }

  static async updateUserNotification(
    userId: Types.ObjectId,
    userData: Partial<updateUserDTO>,
    files?: { document?: UploadedFile; avatar?: UploadedFile }
  ) {
    const UpdatedUserData = {
      ...userData,
    };

    if (files && files.document) {
      const { document } = files;
      const { secure_url, resource_type } =
        await UploadService.uploadToCloudinary(document.tempFilePath);

      UpdatedUserData.document = {
        type: resource_type === "image" ? "image" : "file",
        url: secure_url as string,
      };
    }

    if (files && files.avatar) {
      const { secure_url } = await UploadService.uploadToCloudinary(
        files.avatar.tempFilePath
      );
      UpdatedUserData.avatar = secure_url as string;
    }

    console.log({ UpdatedUserData, files });

    const user = await UserService.updateUser(userId, UpdatedUserData);
    user.password = undefined;
    return ApiSuccess.ok("Profile Updated Successfully", {
      user,
    });
  }
}

export const authService = new AuthService();
