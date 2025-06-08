import { z } from "zod";

export class BookingSchemas {
  static create = z
    .object({
      propertyId: z.string({ required_error: "Property ID is required" }),
      tenantId: z.string({ required_error: "Tenant ID is required" }),
      landlordId: z.string({ required_error: "Landlord ID is required" }),
      startDate: z.date({ required_error: "Start date is required" }),
      endDate: z.date({ required_error: "End date is required" }),
      //   status: z.enum(["active", "expired", "cancelled"], {
      //     required_error: "Status is required",
      //   }),
    })
    .strict();
}
