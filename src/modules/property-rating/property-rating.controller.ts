import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface";
import type { IPropertyRating } from "./property-rating.interface";
import { PropertyRatingService } from "./property-rating.service";
import type { ObjectId } from "mongoose";

export class PropertyRatingController {
  static async createRating(req: Request, res: Response) {
    const { userId, roles } = req.user as AuthenticatedUser;

    const { rating, comment, propertyId } = req.body as IPropertyRating;
    const newRatingData: IPropertyRating = {
      propertyId: propertyId,
      tenantId: userId,
      rating: rating,
      comment: comment,
    };

    const result = await PropertyRatingService.createRating(
      newRatingData,
      roles
    );

    res.status(200).json(result);
  }
  static async updateRating(req: Request, res: Response) {
    const { userId, roles } = req.user as AuthenticatedUser;
    const { rating, comment, propertyId } = req.body as IPropertyRating;

    const updateRatingData: IPropertyRating = {
      propertyId: propertyId,
      tenantId: userId,
      rating: rating,
      comment: comment,
    };

    const result = await PropertyRatingService.updateRating(
      updateRatingData,
      roles
    );

    res.status(200).json(result);
  }

  static async deleteRating(req: Request, res: Response) {
    const { userId, roles } = req.user as AuthenticatedUser;
    const { ratingId } = req.params;

    const result = await PropertyRatingService.deleteRating(ratingId as string);

    res.status(200).json(result);
  }

  static async getRatingById(req: Request, res: Response) {
    const { userId, roles } = req.user as AuthenticatedUser;
    const { ratingId } = req.params as { ratingId: string };
    const result = await PropertyRatingService.getRatingById(
      ratingId,
      userId,

      roles
    );
    res.status(200).json(result);
  }

  static async getAllRatings(req: Request, res: Response) {
    const { userId, roles } = req.user as AuthenticatedUser;
    const { propertyId } = req.params as { propertyId: string };

    const result = await PropertyRatingService.getAllRatings(propertyId, roles);
    res.status(200).json(result);
  }
}
