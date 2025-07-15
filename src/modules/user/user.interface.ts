import type { Document, ObjectId } from "mongoose";

export type UserRolesEnum = ("user" | "landlord" | "tenant" | "admin")[];

export interface IUser extends Document {
  _id: ObjectId | string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | undefined;
  phoneNumber: string;
  password: string | undefined;
  documents: { type: string; url: string; createdAt: Date }[] | null;
  preferences: string[];
  isActive: boolean;
  isVerified: boolean;
  roles: UserRolesEnum;
}

export interface updateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  phoneNumber: string;
  password: string | undefined;
  document: { type: string; url: string } | null;
  preferences: string[];
  isActive: boolean;
  isVerified: boolean;
  roles: UserRolesEnum;
}

export interface AuthenticatedUser {
  userId: ObjectId;
  roles: UserRolesEnum;
  email?: string;
}
