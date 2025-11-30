import type { Document, ObjectId, Types } from "mongoose";
import type { IUser } from "../user/user.interface";
import type { IProperty } from "../property/property.interface";

export interface IFavourite extends Document {
  _id: ObjectId | string;
  user: IUser;
  property: IProperty;
}

export interface ICreateFavouriteDto {
  user: string;
  property: string;
}
