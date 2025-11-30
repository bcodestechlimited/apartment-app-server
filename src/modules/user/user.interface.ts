import type { Document, ObjectId, Types } from "mongoose";

export type UserRolesEnum = ("user" | "landlord" | "tenant" | "admin")[];

export interface IUser extends Document {
  _id: ObjectId | string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | undefined;
  phoneNumber: string;
  password: string | undefined;
  // documents: { type: string; url: string; createdAt: Date }[] | null;
  preferences: string[];
  isActive: boolean;
  isDocumentVerified: boolean;
  isEmailVerified: boolean;
  averageRating: number;
  totalRatings: number;
  onboarded: boolean;
  savedProperties: Types.ObjectId[];
  // onboardingStep: "not_started" | "profile_completed" | "documents_uploaded" | "completed";
  roles: UserRolesEnum;
  provider: string;
  googleId: string | null;
  facebookId: string | null;
  personalInfo: IPersonalInfo | Types.ObjectId | null;
  employment: IEmployment | Types.ObjectId | null;
  documents: (Types.ObjectId | IDocument)[];
  guarantor: IGuarantor | Types.ObjectId | null;
  nextOfKin: INextOfKin | Types.ObjectId | null;
  notificationPreference: INotificationPreference | Types.ObjectId | null;
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
  userId: Types.ObjectId;
  roles: UserRolesEnum;
  email?: string;
}

/**
 * 🔹 PERSONAL INFORMATION
 */
export interface IPersonalInfo {
  user: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: "male" | "female" | "other" | "";
  dob: Date | string;
  address: string;
  state: string;
  city: string;
}

/**
 * 🔹 EMPLOYMENT INFORMATION
 */
export interface IEmployment {
  user: ObjectId;
  employmentStatus: string; // e.g., "employed", "self-employed", "unemployed"
  companyName: string;
  jobTitle: string;
  monthlyIncome: string;
  companyAddress: string;
}

/**
 * 🔹 DOCUMENTS
 */
export interface IDocument {
  user: ObjectId;
  name: string; // e.g., "ID Card", "Utility Bill"
  fileUrl: string; // URL or path to uploaded document
  mimeType: string;
  uploadedAt: Date;
  status: "pending" | "verified" | "rejected";
}

/**
 * 🔹 NEXT OF KIN
 */
export interface INextOfKin {
  user: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  relationship: string; // e.g., "Brother", "Mother", "Friend"
}

/**
 * 🔹 GUARANTOR
 */
export interface IGuarantor {
  user: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  occupation: string;
  workAddress: string;
  homeAddress: string;
}

/**
 * 🔹 NOTIFICATION PREFERENCES
 */
export interface INotificationPreference {
  user: ObjectId;
  bookingUpdates: boolean; // Stay updated on bookings, payments, etc.
  newsDeals: boolean; // Receive news about discounts, new listings
  monthlyTips: boolean; // Get monthly updates, tips, insights
}
