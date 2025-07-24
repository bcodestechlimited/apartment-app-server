import type { IProperty } from "../property/property.interface";
import type { IUser } from "../user/user.interface";

export interface IBookingRequest {
  property: IProperty;
  tenant: IUser;
  landlord: IUser;
  moveInDate: Date;
  moveOutDate: Date;
  basePrice: number;
  netPrice: number; // Price after discounts or fees
  serviceChargeAmount: number; // Additional fees for the booking
  paymentDue?: Date;
  status: "pending" | "approved" | "declined" | "expired";
  paymentStatus: "pending" | "success" | "failed";
  paymentMethod?: string; // e.g., "card", "bank_transfer"
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentReference?: string; // Reference for the payment transaction
  paymentProvider?: string; // e.g., "paystack", "flutterwave"
}
