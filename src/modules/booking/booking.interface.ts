// booking.interface.ts
import type { ObjectId } from "mongoose";
import type { IUser } from "../user/user.interface";
import type { IProperty } from "../property/property.interface";

export interface IBooking {
  property: IProperty;
  tenant: IUser;
  landlord: IUser;
  startDate: Date;
  endDate: Date;
  moveInDate: string;
  basePrice: number;
  netPrice: number; // Price after discounts or fees
  serviceChargeAmount: number; // Additional fees for the booking
  paymentDue: Date; // Date when payment is due
  status: "active" | "overdue";
  paymentStatus: "pending" | "success" | "failed";
  paymentMethod: string; // e.g., "card", "bank_transfer"
  paymentAmount: number;
  paymentCurrency: "NGN" | "USD" | "EUR" | "GBP";
  paymentReference: string; // Reference for the payment transaction
  paymentProvider: string; // e.g., "paystack", "flutterwave"

  canRenew: boolean;
}

export interface IBookingHistory {
  // _id: ObjectId;
  booking: IBooking;
  startDate: Date;
  endDate: Date;
  basePrice: number;
  netPrice: number; // Price after discounts or fees
  serviceChargeAmount: number;
  paymentStatus: "pending" | "success" | "failed";
  paymentMethod: "cash" | "card" | "bank_transfer";
  paymentProvider: "paystack" | "flutterwave";
  paymentReference: string;
  status: "active" | "expired" | "cancelled";
  movedToHistoryAt: Date;
}

export interface CreateBookingDTO {
  propertyId: ObjectId;
  startDate: Date;
  endDate: Date;
}
