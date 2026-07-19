import type { ObjectId } from "mongoose";
import type { IUser } from "../user/user.interface";
import type { IProperty } from "../property/property.interface";
import type { Document } from "mongoose";
import type { ITransaction } from "../transaction/transaction.interface";

export interface IOtherFee {
  name: string;
  amount: number;
}

export interface IBooking extends Document {
  property: IProperty;
  tenant: IUser;
  landlord: IUser;
  days: string[];
  basePrice: number;
  netPrice: number; // Price after discounts or fees
  platformFee: number; // Additional fees for the booking
  otherFees: IOtherFee[];
  status: "pending" | "confirmed" | "cancelled";
  transaction: ITransaction;
}

export interface IBookingDay extends Document {
  booking: IBooking;
  property: IProperty;
  date: Date;
}

export interface CreateBookingDTO {
  propertyId: ObjectId;
  days: string[];
}

export interface UpdateBookingDTO {
  days?: string[];
  status?: "pending" | "confirmed" | "cancelled" | "completed";
}
