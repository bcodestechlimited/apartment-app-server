import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import UserService from "../user/user.service";
import type { ICreateLandlordRatingDto } from "./landlord-rating.interface";
import LandlordRating from "./landlord-rating.model";
import { RatingStatsHelper } from "@/utils/RatingStats";

export class TenantRatingService {
  static createRating = async (ratingDetails: ICreateLandlordRatingDto) => {
    const { landlordId, tenantId, rating, comment } = ratingDetails;

    const existingUser = await UserService.getUserDocumentById(tenantId);
    if (!existingUser) {
      throw ApiError.notFound("User not found.");
    }

    const existingLandlord = await UserService.getUserDocumentById(landlordId);
    const existingRating = await LandlordRating.findOne({
      landlord: landlordId,
      tenant: tenantId,
    });
    if (existingRating) {
      const oldRating = existingRating.rating;
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
      await RatingStatsHelper.update(existingUser, oldRating, rating);
      return ApiSuccess.created("Rating updated successfully", existingRating);
    }

    const newRating = await LandlordRating.create({
      landlord: landlordId,
      tenant: tenantId,
      rating,
      comment,
    });

    await RatingStatsHelper.update(
      existingLandlord,
      undefined,
      ratingDetails.rating
    );

    await newRating.save();
    // await UserService.calculateAVerageRatingonRatingCreated(tenantId, rating);
    return ApiSuccess.created("Rating created successfully", newRating);
  };
  static async updateRating(ratingDetails: ICreateLandlordRatingDto) {
    const { landlordId, tenantId, rating, comment } = ratingDetails;
    const existingRating = await LandlordRating.findOne({
      landlord: landlordId,
      tenant: tenantId,
    });
    if (!existingRating) {
      throw ApiError.notFound("Rating not found.");
    }
    existingRating.rating = rating;
    existingRating.comment = comment;
    const oldRating = existingRating.rating;
    const newRating = rating;
    await existingRating.save();
    const user = await UserService.getUserDocumentById(tenantId);
    await RatingStatsHelper.update(user, oldRating, newRating);
    return ApiSuccess.created("Rating updated successfully", existingRating);
  }

  static async deleteRating(ratingId: string) {
    const existingRating = await LandlordRating.findById(ratingId);
    if (!existingRating) {
      throw ApiError.notFound("Rating not found.");
    }

    const user = await UserService.getUserDocumentById(
      existingRating.tenant._id as string
    );
    const deletedRating = existingRating.rating;

    await existingRating.deleteOne();

    await RatingStatsHelper.update(user, deletedRating, undefined);

    return ApiSuccess.created("Rating deleted successfully", existingRating);
  }
  static async getRatingById(ratingId: string) {
    const existingRating = await LandlordRating.findById(ratingId);
    if (!existingRating) {
      throw ApiError.notFound("Rating not found.");
    }
    return ApiSuccess.created("Rating found successfully", existingRating);
  }
}
