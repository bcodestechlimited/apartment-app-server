import type { ObjectId } from "mongoose";
import { ApiError } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type { RegisterDTO } from "../auth/auth.interface";
import type { IUser, updateUserDTO } from "./user.interface";
import User from "./user.model";

class UserService {
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const { firstName, lastName, password, email } = userData;

    const hashedPassword = await hashPassword(password as string);

    const user = new User({
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      password: hashedPassword,
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
  static async findUserById(userId: ObjectId): Promise<IUser> {
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
}

export default UserService;
