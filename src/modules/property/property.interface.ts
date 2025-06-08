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
  price: string;
  amenities: string[];
  type: PropertyType;
  pictures: string[];
  isDeleted: boolean;
  isVerified: boolean;
  status: string;

  // For standard-rental / serviced-apartment
  numberOfBedRooms?: string;
  numberOfBathrooms?: string;
  // For workspaces
  availability?: string[];
  pricingModel?: PricingModel;
  seatingCapacity?: string;
}

export interface CreatePropertyDTO {
  description: string;
  price: string;
  amenities: string[];
  type: PropertyType;
  pictures: string[];

  // For standard-rental / serviced-apartment
  numberOfBedRooms?: string;
  numberOfBathrooms?: string;

  // For workspaces
  availability?: string[];
  pricingModel?: PricingModel;
  seatingCapacity?: string;
}

export interface UpdatePropertyDTO {
  description: string;
  price: string;
  amenities: string[];
  type: PropertyType;
  pictures: string[];

  // For standard-rental / serviced-apartment
  numberOfRooms?: string;

  // For workspaces
  availability?: string[];
  pricingModel?: PricingModel;
  seatingCapacity?: string;
}
