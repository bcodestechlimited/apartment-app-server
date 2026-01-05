import type { Document, Types } from "mongoose";
import type { IUser } from "../user/user.interface";

export interface ILandlordRating extends Document {
  landlord: IUser;
  rating: number;
  comment: string;
  tenant: IUser;
}

export interface ICreateLandlordRatingDto {
  landlordId: Types.ObjectId;
  rating: number;
  comment: string;
  tenantId: Types.ObjectId;
}
