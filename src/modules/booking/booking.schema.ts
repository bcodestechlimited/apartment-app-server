import { z } from "zod";

export class BookingSchemas {
  static createBooking = z
    .object({
      propertyId: z.string({ required_error: "Property ID is required" }),
      days: z.array(z.string()),
    })
    .strict();

  static createBookingRequest = z.object({
    propertyId: z.string({ required_error: "Property ID is required" }),
    moveInDate: z.string({ required_error: "Move-in date is required" }),
  });

  static updateBookingRequest = z.object({
    status: z.enum(["pending", "cancelled", "approved", "expired"], {
      required_error: "Status is required",
    }),
  });
}
