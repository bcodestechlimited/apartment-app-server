import { z } from "zod";

export class TenantSchemas {
  static rateTenant = z.object({
    tenantId: z.string({ required_error: "Tenant ID is required" }),
    rating: z.number({ required_error: "Rating is required" }),
    comment: z.string({ required_error: "Comment is required" }),
  });

  static reportTenant = z.object({
    tenantId: z.string({ required_error: "Tenant ID is required" }),
    reason: z.string({ required_error: "Reason is required" }),
  });
}
