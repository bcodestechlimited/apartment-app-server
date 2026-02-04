import type { ClientSession, ObjectId, Types } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type {
  IDocument,
  IEmployment,
  IGuarantor,
  INextOfKin,
  IPersonalInfo,
  IUser,
  updateUserDTO,
} from "./user.interface";
import User from "./model/user.model";
import type { IQueryParams } from "@/shared/interfaces/query.interface";
import { paginate } from "@/utils/paginate";
import PersonalInfo from "./model/profile/user.personal-info";
import Employment from "./model/profile/user.employment.model";
import NextOfKin from "./model/profile/user.next-of-kin.model";
import Guarantor from "./model/profile/user.guarantor.model";
import { Document } from "./model/profile/user.document.model";
import type { UploadedFile } from "express-fileupload";
import { UploadService } from "@/services/upload.service";
import { BookingService } from "../booking/booking.service";
import mongoose from "mongoose";
import fs from "fs/promises";
import { TenantService, tenantService } from "../tenant/tenant.service";

class UserService {
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const {
      firstName,
      lastName,
      password,
      email,
      avatar,
      provider,
      roles,
      phoneNumber,
    } = userData;

    if (provider === "google") {
      const googleUser = new User(userData);
      await googleUser.save();
      await PersonalInfo.create({
        user: googleUser._id,
        avatar: avatar || "",
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        phoneNumber: phoneNumber || "",
      });
      return googleUser;
    }

    const hashedPassword = await hashPassword(password as string);

    console.log({ hashedPassword });

    const user = new User({
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      password: hashedPassword,
      avatar: avatar || undefined,
      provider: provider || "local",
      roles: roles,
      phoneNumber: phoneNumber || "",
    });

    await user.save();
    await PersonalInfo.create({
      user: user._id,
      avatar: avatar || "",
      firstName: firstName || "",
      lastName: lastName || "",
      email: email || "",
      phoneNumber: phoneNumber || "",
    });

    return user;
  }
  static async updateUser(
    userId: Types.ObjectId,
    userData: Partial<updateUserDTO>,
  ): Promise<IUser> {
    const { document, preferences, ...otherFields } = userData;

    const updatedFields = {
      ...otherFields,
      onboarded: true,
      $addToSet: {
        documents: userData.document,
        preferences: userData.preferences,
      },
    };

    console.log({ updatedFields });

    const user = await User.findOneAndUpdate({ _id: userId }, updatedFields, {
      new: true,
    });

    if (!user) {
      throw ApiError.notFound("User Not Found");
    }

    return user;
  }
  static async updateUserByAdmin(
    userId: string,
    userData: Partial<updateUserDTO>,
  ) {
    const user = await User.findOneAndUpdate({ _id: userId }, userData, {
      new: true,
    });
    if (!user) {
      throw ApiError.notFound("User Not Found");
    }

    // if (user.roles.includes("tenant")) {
    //   console.log("updating tenant status");
    //   await TenantService.updateTenantStatus(
    //     user._id as string,
    //     userData.isActive as boolean
    //   );
    // }

    return ApiSuccess.ok("User updated successfully", { user });
  }

  static async findUserByEmail(email: string): Promise<IUser> {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw ApiError.notFound("No user with this email");
    }
    return user;
  }

  static async getUserDocumentById(propertyId: string | Types.ObjectId) {
    const user = await User.findOne({ _id: propertyId });
    if (!user) {
      throw ApiError.notFound("Property not found");
    }

    return user;
  }
  static async findUserById(userId: Types.ObjectId | string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound("User Not Found");
    }

    return user;
  }
  static async checkIfUserExists(email: string): Promise<void> {
    const user = await User.findOne({ email });

    if (user) {
      throw ApiError.badRequest("User with this email exists");
    }
  }

  static async getUserOrNull(email: string): Promise<IUser | null> {
    const user = await User.findOne({ email });
    if (!user) {
      return null;
    }
    return user;
  }

  static async getAllUsers(query: IQueryParams) {
    const { page, limit } = query;
    const filterQuery = {};
    const sort = { createdAt: -1 };
    const populateOptions = [{ path: "user" }];

    const { documents: users, pagination } = await paginate({
      model: User,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.ok("Users retrieved successfully", {
      users,
      pagination,
    });
  }

  static async getUserById(userId: string) {
    const user = await this.findUserById(userId);
    return ApiSuccess.ok("User retrieved successfully", { user });
  }

  // Personal Info
  static async getUserPersonalInfo(
    userId: Types.ObjectId,
  ): Promise<IPersonalInfo> {
    let personalInfo = await PersonalInfo.findOne({ user: userId });

    if (!personalInfo) {
      personalInfo = await PersonalInfo.create({ user: userId });
    }

    return personalInfo;
  }

  static async updateUserInformation(
    userId: Types.ObjectId,
    userData: any,
    files?: { avatar?: UploadedFile },
  ): Promise<IPersonalInfo> {
    // console.log({ userId, userData, files });
    const UpdatedUserData = {
      ...userData,
    };

    if (files && files.avatar) {
      const { secure_url } = await UploadService.uploadToCloudinary(
        files.avatar.tempFilePath,
      );
      UpdatedUserData.avatar = secure_url as string;
      await fs.unlink(files.avatar.tempFilePath).catch(console.error);
    }

    if (!files || !files.avatar) {
      UpdatedUserData.avatar = "";
    }

    let personalInfo = await PersonalInfo.findOneAndUpdate(
      { user: userId },
      UpdatedUserData,
      {
        new: true,
        runValidators: true,
        upsert: false,
      },
    );

    // console.log(" personal info", { personalInfo });

    // console.log("about to check personal info");
    if (!personalInfo) {
      personalInfo = await PersonalInfo.create({
        ...UpdatedUserData,
        user: userId,
      });
    }

    const user = await this.findUserById(userId);
    // console.log("personal info user", user);
    user.personalInfo = personalInfo._id;
    user.avatar = personalInfo.avatar;
    user.phoneNumber = personalInfo.phoneNumber;
    await user.save();
    // console.log("final personal info", { personalInfo });

    return personalInfo;
  }

  // Employment
  static async getUserEmployment(userId: Types.ObjectId): Promise<IEmployment> {
    let userEmployment = await Employment.findOne({ user: userId });

    if (!userEmployment) {
      userEmployment = await Employment.create({ user: userId });
    }

    return userEmployment;
  }

  static async updateUserEmployment(
    userId: Types.ObjectId,
    userData: any,
  ): Promise<IEmployment> {
    console.log({ userId, userData });

    let employment = await Employment.findOneAndUpdate(
      { user: userId },
      userData,
      {
        // new: true,
        runValidators: true,
      },
    );

    console.log({ employment });

    if (!employment) {
      employment = await Employment.create({ ...userData, user: userId });
      const user = await this.findUserById(userId);
      user.employment = employment._id;
      await user.save();
    }

    return employment;
  }

  // Documents
  static async getUserDocuments(
    userId: Types.ObjectId | string,
  ): Promise<IDocument[]> {
    let userDocuments = await Document.find({ user: userId }).sort({
      createdAt: -1,
    });

    return userDocuments;
  }

  static async getAllUserDocuments(query: IQueryParams) {
    const { limit = 10, page = 1, search, verificationStatus, sortBy } = query;

    const filterQuery: Record<string, any> = {};
    const populateOptions = [{ path: "user", select: "-password" }];
    if (search) {
      const searchRegex = new RegExp(search, "i");

      filterQuery["$or"] = [
        { name: searchRegex },

        { "user.firstName": searchRegex },
        { "user.lastName": searchRegex },
        { "user.email": searchRegex },
      ];
    }

    console.log({ filterQuery });
    if (verificationStatus) {
      filterQuery.status = verificationStatus;
    }

    // --- C. Handle Sorting ---
    let mongooseSort: Record<string, any> = { createdAt: -1 }; // Default sort
    if (sortBy) {
      // Example sortBy format: "field:order" (e.g., "documentType:1" or "createdAt:-1")
      const [field, order] = sortBy.split(":");
      if (field && order) {
        mongooseSort = {
          [field]: order === "1" ? 1 : order === "-1" ? -1 : order,
        };
      } else {
        mongooseSort = { [field]: 1 };
      }
    }

    const statusCounts = await Document.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMeta = statusCounts.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 },
    );

    const { documents, pagination } = await paginate({
      model: Document,
      query: filterQuery,
      page: page,
      limit: limit,
      sort: mongooseSort,
      populateOptions,
    });

    statusMeta.total = pagination.totalCount;

    return ApiSuccess.ok("Documents retrieved successfully", {
      documents,
      pagination,

      statusCounts: statusMeta,
    });
  }

  static async verifyDocument(id: Types.ObjectId) {
    const document = await Document.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true },
    );
    if (!document) {
      throw ApiError.notFound("Document Not Found");
    }

    await this.verifyUserDocument(document.user);
    return ApiSuccess.ok("Document verified successfully", { document });
  }

  static async rejectUserDocument(id: Types.ObjectId) {
    const document = await Document.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true },
    );
    if (!document) {
      throw ApiError.notFound("Document Not Found");
    }
    await this.unVerrifyUserDocument(document.user);
    return ApiSuccess.ok("Document rejected successfully", { document });
  }

  static async uploadUserDocument(
    userId: Types.ObjectId,
    files?: { document?: UploadedFile },
  ): Promise<IDocument[]> {
    console.log({ userId, files, document: files?.document });

    let payload: Record<string, any> = {
      user: userId,
    };

    if (files && files.document) {
      const { document } = files;
      const { secure_url } = await UploadService.uploadToCloudinary(
        document.tempFilePath,
      );

      payload.fileUrl = secure_url as string;
      payload.uploadedAt = Date.now();
      payload.name = document?.name.replaceAll(" ", "_") || "Document";
    }

    console.log({ payload });

    const newDocument = await Document.create({ ...payload, user: userId });
    const user = await this.findUserById(userId);
    if (user.documents) {
      user.documents.push(newDocument._id);
    } else {
      user.documents = [newDocument._id];
    }
    await user.save();

    return [newDocument];
  }

  // Next Of Kin
  static async getUserNextOfKin(userId: Types.ObjectId): Promise<INextOfKin> {
    let nextOfKin = await NextOfKin.findOne({ user: userId });

    if (!nextOfKin) {
      nextOfKin = await NextOfKin.create({ user: userId });
    }

    return nextOfKin;
  }

  static async updateUserNextOfKin(
    userId: Types.ObjectId,
    userData: any,
  ): Promise<INextOfKin> {
    let nextOfKin = await NextOfKin.findOneAndUpdate(
      { user: userId },
      userData,
      {
        // new: true,
        runValidators: true,
      },
    );

    if (!nextOfKin) {
      nextOfKin = await NextOfKin.create({ ...userData, user: userId });
      const user = await this.findUserById(userId);
      user.nextOfKin = nextOfKin._id;
      await user.save();
    }

    return nextOfKin;
  }

  // Guarantor
  static async getUserGuarantor(userId: Types.ObjectId): Promise<IGuarantor> {
    let userGuarantor = await Guarantor.findOne({ user: userId });

    if (!userGuarantor) {
      userGuarantor = await Guarantor.create({ user: userId });
    }

    return userGuarantor;
  }

  // user.controller.ts (or wherever you list tenants)

  static async updateUserGuarantor(
    userId: Types.ObjectId,
    userData: any,
  ): Promise<IGuarantor> {
    console.log({ userId, userData });

    let userGuarantor = await Guarantor.findOneAndUpdate(
      { user: userId },
      userData,
      {
        // new: true,
        runValidators: true,
      },
    );

    if (!userGuarantor) {
      userGuarantor = await Guarantor.create({ ...userData, user: userId });
      const user = await this.findUserById(userId);
      user.guarantor = userGuarantor._id;
      await user.save();
    }

    return userGuarantor;
  }

  // user.controller.ts

  static async getTenantsForAdmin(query: IQueryParams) {
    const { limit = 10, page = 1, status, isVerified, search } = query;

    console.log({ limit, page, status, isVerified, search });

    // 1. Basic filter: always restrict to tenants
    const filterQuery: any = { roles: "tenant" };

    // 2. Filter by Payment Status (Real field on User model)
    // Check if status is provided and NOT the string "all"
    if (status && status !== "all" && status !== "") {
      filterQuery.paymentStatus = status;
    }

    // Check if isVerified is a valid boolean string
    if (isVerified !== undefined && isVerified !== "" && isVerified !== "all") {
      filterQuery.isDocumentVerified = isVerified === "true";
    }

    // 4. Add Search Functionality (Search by Name or Email)
    if (search) {
      const searchRegex = new RegExp(search as string, "i"); // "i" for case-insensitive
      filterQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // 5. Execute pagination with the virtual count populated
    const { documents: tenants, pagination } = await paginate({
      model: User,
      query: filterQuery,
      page,
      limit,
      // Use the virtual for active booking counts (performance optimized)
      populateOptions: [{ path: "activeBookingsCount" }],
      sort: { createdAt: -1 },
    });

    return ApiSuccess.ok("Tenants retrieved successfully", {
      tenants,
      pagination,
    });
  }

  static async getTenantForAdmin(userId: ObjectId | string) {
    const tenant = await User.findById(userId).populate("activeBookingsCount");
    if (!tenant) {
      throw ApiError.notFound("Tenant not found");
    }
    return tenant;
  }

  static async addToSavedProperties(
    userId: Types.ObjectId,
    propertyId: Types.ObjectId,
  ) {
    const user = await this.findUserById(userId);
    user.savedProperties.push(propertyId);
    await user.save();
    return user;
  }

  static async removeFromSavedProperties(
    userId: Types.ObjectId,
    propertyId: string,
  ) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedProperties: propertyId } },
      { new: true },
    );
    if (!user) {
      throw ApiError.notFound("User Not Found");
    }
    return user;
  }

  static async verifiedLandlordsCount() {
    const count = await User.countDocuments({
      roles: "landlord",
      isEmailVerified: true,
    });
    return count;
  }

  static async syncUserPaymentStatus(
    userId: ObjectId | string | Types.ObjectId,
  ): Promise<void> {
    // 1. Fetch all bookings for this tenant that aren't 'success'
    const unresolvedBookings =
      await BookingService.getBookingByIdAndPaymentStatus(userId as string);

    let status = "Cleared";

    if (unresolvedBookings.length > 0) {
      // 2. Check if ANY booking has failed
      const hasFailed = unresolvedBookings.some(
        (b) => b.paymentStatus === "failed",
      );

      if (hasFailed) {
        status = "Overdue"; // Priority 1: If anything failed, they are overdue
      } else {
        status = "Outstanding"; // Priority 2: If nothing failed but some are pending
      }
    }

    // 3. Update the User model
    await User.findByIdAndUpdate(userId, { paymentStatus: status });
  }

  static async verifyUserDocument(id: ObjectId | string) {
    const document = await User.findByIdAndUpdate(
      id,
      { isDocumentVerified: true },
      { new: true },
    );
    if (!document) {
      throw ApiError.notFound("Document Not Found");
    }
    // return ApiSuccess.ok("Document verified successfully", { document });
  }

  static async unVerrifyUserDocument(id: ObjectId | string) {
    const document = await User.findByIdAndUpdate(
      id,
      { isDocumentVerified: false },
      { new: true },
    );
    if (!document) {
      throw ApiError.notFound("Document Not Found");
    }
    // return ApiSuccess.ok("Document rejected successfully", { document });
  }

  //landlord

  static async getLandlordsForAdmin(query: IQueryParams) {
    const { page, limit, search, status } = query;
    const filterQuery: any = { roles: "landlord" };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filterQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    if (status === "Verified") {
      filterQuery.isDocumentVerified = true;
    }
    if (status === "Unverified") {
      filterQuery.isDocumentVerified = false;
    }
    const sort = { createdAt: -1 };
    const { documents: landlords, pagination } = await paginate({
      model: User,
      query: filterQuery,
      page,
      limit,
      sort,
    });
    return ApiSuccess.ok("Landlords retrieved successfully", {
      landlords,
      pagination,
    });
  }

  static async getLandlordForAdmin(userId: ObjectId | string) {
    const landlord = await User.findById(userId).populate(
      "activeBookingsCount",
    );
    if (!landlord) {
      throw ApiError.notFound("Landlord not found");
    }
    return landlord;
  }

  static async updateLandlordStats(
    userId: string | Types.ObjectId,
    update: {
      propertiesDelta?: number;
      earningsDelta?: number;
      newStatus?: "Verified" | "Pending" | "Failed";
    },
    session?: ClientSession,
  ) {
    const incrementFields: any = {};
    if (update.propertiesDelta)
      incrementFields.propertiesCount = update.propertiesDelta;
    if (update.earningsDelta)
      incrementFields.totalEarnings = update.earningsDelta;

    const updateFields: any = {};
    if (update.newStatus) updateFields.verificationStatus = update.newStatus;

    return await User.findByIdAndUpdate(
      userId,
      {
        $inc: incrementFields,
        $set: updateFields,
      },
      { session },
    );
  }

  static calculateAVerageRatingonRatingCreated = async (
    UserId: Types.ObjectId | string,
    newRating: number,
  ) => {
    const landlord = await User.findById(UserId);
    if (!landlord) throw ApiError.notFound("Landlord not found.");

    const { averageRating, totalRatings } = landlord;
    const newTotal = totalRatings + 1;
    const newAverage = (averageRating * totalRatings + newRating) / newTotal;

    landlord.averageRating = parseFloat(newAverage.toFixed(2));
    landlord.totalRatings = newTotal;

    await landlord.save();
  };

  static calculateAVerageRatingonRatingUpdated = async (
    UserId: Types.ObjectId | string,
    oldRating: number,
    newRating: number,
  ) => {
    const landlord = await User.findById(UserId);
    if (!landlord) throw ApiError.notFound("Landlord not found.");

    const { averageRating, totalRatings } = landlord;

    // Adjust average by removing old rating and adding new one
    const newAverage =
      (averageRating * totalRatings - oldRating + newRating) / totalRatings;

    landlord.averageRating = parseFloat(newAverage.toFixed(2));
    await landlord.save();
  };

  static calculateAVerageRatingonRatingDeleted = async (
    UserId: Types.ObjectId | string,
    deletedRating: number,
  ) => {
    const landlord = await User.findById(UserId);
    if (!landlord) throw ApiError.notFound("Landlord not found.");

    const { averageRating, totalRatings } = landlord;

    if (totalRatings <= 1) {
      // If it was the only rating
      landlord.averageRating = 0;
      landlord.totalRatings = 0;
    } else {
      const newTotal = totalRatings - 1;
      const newAverage =
        (averageRating * totalRatings - deletedRating) / newTotal;

      landlord.averageRating = parseFloat(newAverage.toFixed(2));
      landlord.totalRatings = newTotal;
    }

    await landlord.save();
  };

  static async totalActiveTenants() {
    const count = await User.countDocuments({
      isActive: true,
      roles: "tenant",
    });
    return count;
  }

  static async totalTenantsCount() {
    const count = await User.countDocuments({ roles: "tenant" });
    return count;
  }

  static async updateUserPaystackReceipientCode(
    userId: Types.ObjectId | ObjectId,
    code: string,
  ) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found.");
    user.paystackRecipientCode = code;
    await user.save();
  }
}

export default UserService;
