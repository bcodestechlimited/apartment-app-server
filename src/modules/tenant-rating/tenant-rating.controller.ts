import type { Request, Response } from "express";
import type {
  ICreateTenantRatingDto,
  ITenantRating,
} from "./tenant-rating.interface";
import type { AuthenticatedUser, IUser } from "../user/user.interface";
import { TenantRatingService } from "./tenant-rating.service";
import type { ObjectId, Types } from "mongoose";

export class TenantRatingController {
  static async createRating(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;

    const { rating, comment, tenantId } = req.body as ICreateTenantRatingDto;
    const newRatingData = {
      landlordId: userId,
      tenantId: tenantId,
      rating: rating,
      comment: comment,
    };
    console.log(newRatingData);

    const result = await TenantRatingService.createRating(newRatingData);

    res.status(200).json(result);
  }
  static async updateRating(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { rating, comment, tenantId } = req.body as ICreateTenantRatingDto;

    const updateRatingData = {
      landlordId: userId,
      tenantId: tenantId,
      rating: rating,
      comment: comment,
    };

    const result = await TenantRatingService.updateRating(updateRatingData);

    res.status(200).json(result);
  }

  static async deleteRating(req: Request, res: Response) {
    // const { userId } = req.user as AuthenticatedUser;
    const { ratingId } = req.params;

    const result = await TenantRatingService.deleteRating(ratingId as string);

    res.status(200).json(result);
  }

  static async getRatingById(req: Request, res: Response) {
    // const { userId } = req.user as AuthenticatedUser;
    const { ratingId } = req.params as { ratingId: string };
    const result = await TenantRatingService.getRatingById(ratingId);
    res.status(200).json(result);
  }

  static async getAllRatingsByLandlordId(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await TenantRatingService.getAllRatingsByLandlordId(userId);
    res.status(200).json(result);
  }

  static async getAllRatings(req: Request, res: Response) {
    const result = await TenantRatingService.getAllRatings();
    res.status(200).json(result);
  }
}
