import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import UserService from "../user/user.service";
import type { ICreateTenantRatingDto } from "./tenant-rating.interface";
import TenantRating from "./tenant-rating.model";

export class TenantRatingService {
  static createRating = async (ratingDetails: ICreateTenantRatingDto) => {
    const { landlordId, tenantId, rating, comment } = ratingDetails;

    const existingUser = await UserService.findUserById(tenantId);
    if (!existingUser) {
      throw ApiError.notFound("User not found.");
    }

    const existingRating = await TenantRating.findOne({
      landlordId: landlordId,
      tenantId: tenantId,
    });
    if (existingRating) {
      throw ApiError.badRequest("You have already rated this landlord.");
    }

    const newRating = await TenantRating.create({
      landlord: landlordId,
      tenant: tenantId,
      rating,
      comment,
    });

    await UserService.calculateAVerageRatingonRatingCreated(tenantId, rating);
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

    const oldRating = existingRating.rating;
    const newRatingValue = rating ?? oldRating;

    // Update rating doc
    existingRating.rating = newRatingValue;
    if (comment) existingRating.comment = comment;
    await existingRating.save();

    await UserService.calculateAVerageRatingonRatingUpdated(
      tenantId,
      oldRating,
      newRatingValue
    );
    return ApiSuccess.created("Rating updated successfully", existingRating);
  }

  static async deleteRating(ratingId: string) {
    const existingRating = await TenantRating.findById(ratingId);
    if (!existingRating) {
      throw ApiError.notFound("Rating not found.");
    }
    const tenantId = existingRating.tenant._id;
    const deletedRating = existingRating.rating;
    await existingRating.deleteOne();

    await UserService.calculateAVerageRatingonRatingDeleted(
      tenantId as string,
      deletedRating
    );
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
