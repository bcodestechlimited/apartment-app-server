import type { Document, ObjectId } from "mongoose";

export type UserRolesEnum = ("user" | "landlord" | "tenant" | "admin")[];

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string | undefined;
  isActive: boolean;
  isVerified: boolean;
  roles: UserRolesEnum;
}

export interface AuthenticatedUser {
  userId: ObjectId;
  roles: UserRolesEnum;
  email?: string;
}
