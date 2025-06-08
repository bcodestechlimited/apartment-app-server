// booking.interface.ts
import type { ObjectId } from "mongoose";

export interface IBooking {
  property: ObjectId;
  tenant: ObjectId;
  landlord: ObjectId; // derived from Property.user
  totalPrice: number;
  startDate: Date;
  endDate: Date;
  paymentStatus: "pending" | "completed" | "failed";
  status: "active" | "expired" | "cancelled";
}

export interface CreateBookingDTO {
  propertyId: ObjectId;
  startDate: Date;
  endDate: Date;
}
