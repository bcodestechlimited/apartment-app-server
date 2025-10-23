import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type {
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

class UserService {
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const { firstName, lastName, password, email, avatar, provider, roles } =
      userData;

    if (provider === "google") {
      const googleUser = new User(userData);
      await googleUser.save();
      return googleUser;
    }

    const hashedPassword = await hashPassword(password as string);

    const user = new User({
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      password: hashedPassword,
      avatar: avatar || undefined,
      provider: provider || "local",
      roles: roles,
    });

    await user.save();

    return user;
  }
  static async updateUser(
    userId: ObjectId,
    userData: Partial<updateUserDTO>
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
  static async findUserByEmail(email: string): Promise<IUser> {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw ApiError.notFound("No user with this email");
    }
    return user;
  }
  static async findUserById(userId: ObjectId | string): Promise<IUser> {
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
  static async getUserPersonalInfo(userId: ObjectId): Promise<IPersonalInfo> {
    let personalInfo = await PersonalInfo.findOne({ user: userId });

    if (!personalInfo) {
      personalInfo = await PersonalInfo.create({ user: userId });
    }

    return personalInfo;
  }

  static async updateUserInformation(
    userId: ObjectId,
    userData: any
  ): Promise<IPersonalInfo> {
    let personalInfo = await PersonalInfo.findOneAndUpdate(
      { user: userId },
      userData,
      {
        // new: true,
        runValidators: true,
      }
    );

    if (!personalInfo) {
      personalInfo = await PersonalInfo.create({ ...userData, user: userId });
      const user = await this.findUserById(userId);
      user.personalInfo = personalInfo._id;
      await user.save();
    }

    return personalInfo;
  }

  // Employment
  static async getUserEmployment(userId: ObjectId): Promise<IEmployment> {
    let userEmployment = await Employment.findOne({ user: userId });

    if (!userEmployment) {
      userEmployment = await Employment.create({ user: userId });
    }

    return userEmployment;
  }

  static async updateUserEmployment(
    userId: ObjectId,
    userData: any
  ): Promise<IEmployment> {
    console.log({ userId, userData });

    let employment = await Employment.findOneAndUpdate(
      { user: userId },
      userData,
      {
        // new: true,
        runValidators: true,
      }
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

  // Next Of Kin
  static async getUserNextOfKin(userId: ObjectId): Promise<INextOfKin> {
    let nextOfKin = await NextOfKin.findOne({ user: userId });

    if (!nextOfKin) {
      nextOfKin = await NextOfKin.create({ user: userId });
    }

    return nextOfKin;
  }

  static async updateUserNextOfKin(
    userId: ObjectId,
    userData: any
  ): Promise<INextOfKin> {
    let nextOfKin = await NextOfKin.findOneAndUpdate(
      { user: userId },
      userData,
      {
        // new: true,
        runValidators: true,
      }
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
  static async getUserGuarantor(userId: ObjectId): Promise<IGuarantor> {
    let userGuarantor = await Guarantor.findOne({ user: userId });

    if (!userGuarantor) {
      userGuarantor = await Guarantor.create({ user: userId });
    }

    return userGuarantor;
  }

  static async updateUserGuarantor(
    userId: ObjectId,
    userData: any
  ): Promise<IGuarantor> {
    console.log({ userId, userData });

    let userGuarantor = await Guarantor.findOneAndUpdate(
      { user: userId },
      userData,
      {
        // new: true,
        runValidators: true,
      }
    );

    if (!userGuarantor) {
      userGuarantor = await Guarantor.create({ ...userData, user: userId });
      const user = await this.findUserById(userId);
      user.guarantor = userGuarantor._id;
      await user.save();
    }

    return userGuarantor;
  }
}

export default UserService;
