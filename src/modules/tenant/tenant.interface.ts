import type { Document, ObjectId } from "mongoose";
import type { IUser } from "../user/user.interface";
import type { IProperty } from "../property/property.interface";

export interface ITenant extends Document {
  _id: ObjectId | string;
  user: IUser;
  landlord: IUser;
  property: IProperty;
  moveInDate: Date;
  moveOutDate: Date;
  endDate?: Date;
  isActive: boolean;
  //   rentAmount: number;
  //   paymentReference: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface createTenantDTO {
  user: string | ObjectId; // user._id (the tenant)
  landlord: string | ObjectId;
  property: string | ObjectId;
  moveInDate: Date;
  moveOutDate: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface updateTenantDTO {
  user?: string | ObjectId; // user._id (the tenant)
  landlord?: string | ObjectId;
  property?: string | ObjectId;
  moveInDate?: Date;
  endDate?: Date;
}
