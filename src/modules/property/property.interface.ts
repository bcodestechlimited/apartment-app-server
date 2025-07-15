import type { Document, ObjectId } from "mongoose";
import type { IUser } from "../user/user.interface";

export enum PropertyType {
  SERVICED_APARTMENT = "serviced-apartment",
  SHARED_APARTMENT = "shared-apartment",
  STANDARD_RENTAL = "standard-rental",
  SHORT_LETS = "short-let",
  CO_WORKING_SPACE = "co-working-space",
  OTHER = "other",
}

export enum PricingModel {
  DAILY = "daily",
  HOURLY = "hourly",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export interface IProperty extends Document {
  _id: ObjectId | string;
  user: IUser;
  title: string;
  description: string;
  price: string;
  // location: string;
  address: string;
  state: string;
  lga: string;
  pricingModel: PricingModel;
  amenities: string[];
  facilities: string[];
  type: PropertyType;
  pictures: string[];
  isDeleted: boolean;
  isVerified: boolean;
  isAvailable: boolean;
  status: string;
  users: IUser[];
  // For standard-rental / serviced-apartment
  availabilityDate: string;
  numberOfBedRooms?: string;
  numberOfBathrooms?: string;
  // For workspaces
  seatingCapacity?: string;
}

export interface CreatePropertyDTO {
  title: string;
  description: string;
  price: string;
  address: string;
  state: string;
  lga: string;
  availabilityDate: string;
  amenities: string;
  facilities: string;
  type: PropertyType;
  pictures: string[];
  pricingModel: PricingModel;

  // For standard-rental / serviced-apartment
  numberOfBedRooms?: string;
  numberOfBathrooms?: string;

  // For workspaces
  availability?: string[];
  seatingCapacity?: string;
}

export interface UpdatePropertyDTO {
  description: string;
  price: string;
  location: string;
  amenities: string[];
  facilities: string[];
  type: PropertyType;
  pictures: string[];
  pricingModel: PricingModel;
  isDeleted: boolean;
  isVerified: boolean;
  isAvailable: boolean;

  // For standard-rental / serviced-apartment
  numberOfRooms?: string;

  // For workspaces
  availability?: string[];
  seatingCapacity?: string;
}
