import type { Request, Response } from "express";
import type {
  ICreateLandlordRatingDto,
  ILandlordRating,
} from "./landlord-rating.interface";
import type { AuthenticatedUser, IUser } from "../user/user.interface";
import { LandlordRatingService } from "./landlord-rating.service";
import type { ObjectId, Types } from "mongoose";

export class LandlordRatingController {
  static async createRating(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;

    const { rating, comment, tenantId } = req.body as ICreateLandlordRatingDto;
    const newRatingData = {
      landlordId: userId,
      tenantId: tenantId,
      rating: rating,
      comment: comment,
    };
    console.log(newRatingData);

    const result = await LandlordRatingService.createRating(newRatingData);

    res.status(200).json(result);
  }
  static async updateRating(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { rating, comment, tenantId } = req.body as ICreateLandlordRatingDto;

    const updateRatingData = {
      landlordId: userId,
      tenantId: tenantId,
      rating: rating,
      comment: comment,
    };

    const result = await LandlordRatingService.updateRating(updateRatingData);

    res.status(200).json(result);
  }

  static async deleteRating(req: Request, res: Response) {
    // const { userId } = req.user as AuthenticatedUser;
    const { ratingId } = req.params;

    const result = await LandlordRatingService.deleteRating(ratingId as string);

    res.status(200).json(result);
  }

  static async getRatingById(req: Request, res: Response) {
    // const { userId } = req.user as AuthenticatedUser;
    const { ratingId } = req.params as { ratingId: string };
    const result = await LandlordRatingService.getRatingById(ratingId);
    res.status(200).json(result);
  }

  static async getAllRatingsByLandlordId(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await LandlordRatingService.getAllRatingsByLandlordId(
      userId
    );
    res.status(200).json(result);
  }

  static async getAllRatings(req: Request, res: Response) {
    const result = await LandlordRatingService.getAllRatings();
    res.status(200).json(result);
  }
}
