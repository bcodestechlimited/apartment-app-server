import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import UserService from "../user/user.service";
import type { ICreateTenantRatingDto } from "./tenant-rating.interface";
import TenantRating from "./tenant-rating.model";
import { RatingStatsHelper } from "@/utils/RatingStats";

export class TenantRatingService {
  static createRating = async (ratingDetails: ICreateTenantRatingDto) => {
    const { landlordId, tenantId } = ratingDetails;

    const existingUser = await UserService.getUserDocumentById(tenantId);
    if (!existingUser) {
      throw ApiError.notFound("User not found.");
    }

    const existingRating = await TenantRating.findOne({
      landlordId: landlordId,
      tenantId: tenantId,
    });
    if (existingRating) {
      throw ApiError.badRequest("Rating already exists for this property.");
    }

    const newRating = new TenantRating({
      landlord: landlordId,
      tenant: tenantId,
      rating: ratingDetails.rating,
      comment: ratingDetails.comment,
    });

    await RatingStatsHelper.update(
      existingUser,
      undefined,
      ratingDetails.rating
    );

    await newRating.save();
    return ApiSuccess.created("Rating created successfully", newRating);
  };
  static async updateRating(ratingDetails: ICreateTenantRatingDto) {
    const { landlordId, tenantId, rating, comment } = ratingDetails;
    const existingRating = await TenantRating.findOne({
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
    const existingRating = await TenantRating.findById(ratingId);
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
    const existingRating = await TenantRating.findById(ratingId);
    if (!existingRating) {
      throw ApiError.notFound("Rating not found.");
    }
    return ApiSuccess.created("Rating found successfully", existingRating);
  }
}
