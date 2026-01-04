import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface";
import type { ICreateLandlordRatingDto } from "./landlord-rating.interface";
import { TenantRatingService } from "./landlord-rating.service";
import type { Types } from "mongoose";

export class LandlordRatingController {
  static async createRating(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;

    const { rating, comment, landlordId } =
      req.body as ICreateLandlordRatingDto;
    const newRatingData = {
      landlordId: landlordId,
      tenantId: userId,
      rating: rating,
      comment: comment,
    };

    const result = await TenantRatingService.createRating(newRatingData);

    res.status(200).json(result);
  }

  static async updateRating(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { rating, comment, landlordId } =
      req.body as ICreateLandlordRatingDto;

    const updateRatingData = {
      landlordId: landlordId,
      tenantId: userId,
      rating: rating,
      comment: comment,
    };

    const result = await TenantRatingService.updateRating(updateRatingData);

    res.status(200).json(result);
  }

  static async deleteRating(req: Request, res: Response) {
    const { ratingId } = req.params;

    const result = await TenantRatingService.deleteRating(ratingId as string);

    res.status(200).json(result);
  }

  static async getRatingById(req: Request, res: Response) {
    const { ratingId } = req.params as { ratingId: string };
    const result = await TenantRatingService.getRatingById(ratingId);
    res.status(200).json(result);
  }
}
