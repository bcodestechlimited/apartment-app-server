import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface";
import type { ICreateTenantRatingDto } from "./tenant-rating.interface";
import { TenantRatingService } from "./tenant-rating.service";

export class TenantRatingController {
  static async createRating(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;

    const { rating, comment, landlordId } = req.body as ICreateTenantRatingDto;
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
    const { rating, comment, landlordId } = req.body as ICreateTenantRatingDto;

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
