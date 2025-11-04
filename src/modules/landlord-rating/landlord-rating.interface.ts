import type { Document, ObjectId, Types } from "mongoose";
import type { IUser } from "../user/user.interface";
import type mongoose from "mongoose";

export interface ILandlordRating extends Document {
  // _id: ObjectId | string;
  landlord: IUser;
  rating: number;
  comment: string;
  tenant: IUser;
  averageRating: number;
}

export interface ICreateLandlordRatingDto {
  landlordId: Types.ObjectId;
  rating: number;
  comment: string;
  tenantId: Types.ObjectId;
}
