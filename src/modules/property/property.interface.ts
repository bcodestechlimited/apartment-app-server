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
  DAILY = "daily",
  HOURLY = "hourly",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export interface IProperty {
  user: ObjectId;
  description: string;
  price: string;
  location: string;
  amenities: string[];
  facilities: string[];
  type: PropertyType;
  pictures: string[];
  isDeleted: boolean;
  isVerified: boolean;
  isAvailable: boolean;
  pricingModel: PricingModel;
  status: string;

  // For standard-rental / serviced-apartment
  numberOfBedRooms?: string;
  numberOfBathrooms?: string;
  // For workspaces
  availability?: string[];
  seatingCapacity?: string;
}

export interface CreatePropertyDTO {
  description: string;
  price: string;
  location: string;
  amenities: string[];
  facilities: string[];
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

  // For standard-rental / serviced-apartment
  numberOfRooms?: string;

  // For workspaces
  availability?: string[];
  seatingCapacity?: string;
}
