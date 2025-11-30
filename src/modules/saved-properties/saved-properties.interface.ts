import type { IProperty } from "../property/property.interface";
import type { IUser } from "../user/user.interface";

export interface ISavedProperties {
  user: IUser; // User ID
  property: IProperty; // Property ID
  savedAt: Date;
}
