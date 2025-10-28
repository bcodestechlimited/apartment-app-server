import type { Types } from "mongoose";

export interface IPropertyRating {
  propertyId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId: Types.ObjectId;
}
