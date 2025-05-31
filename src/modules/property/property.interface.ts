import type { ObjectId } from "mongoose";

export enum PropertyType {
  SERVICED_APARTMENT = "serviced-apartment",
  SHARED_APARTMENT = "shared-apartment",
  STANDARD_RENTAL = "standard-rental",
  SHORT_LETS = "short-lets",
  CO_WORKING_SPACE = "co-working-space",
  OTHER = "other",
}

export enum PricingModel {
  HOURLY = "hourly",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

export interface IProperty {
  user: ObjectId;
  description: string;
  amenities: string[];
  type: PropertyType;
  pictures: string[];
  isDeleted: boolean;

  // For standard-rental / serviced-apartment
  numberOfRooms?: number;

  // For workspaces
  availability?: string[];
  pricingModel?: PricingModel;
  seatingCapacity?: number;
}

export interface CreatePropertyDTO {
  email: string;
  password: string;
  firstName?: string;
  [key: string]: any;
}

export interface UpdatePropertyDTO {
  email: string;
  password: string;
  firstName?: string;
  [key: string]: any;
}
