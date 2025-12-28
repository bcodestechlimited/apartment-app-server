import { z } from "zod";

export class FavouriteSchemas {
  static createFavourite = z.object({
    propertyId: z.string({ required_error: "Property ID is required" }),
    userId: z.string({ required_error: "User ID is required" }),
  });
}
