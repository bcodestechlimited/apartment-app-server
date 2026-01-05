import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import type {
  ICreateTenantRatingDto,
  ITenantRating,
} from "./tenant-rating.interface";
import TenantRating from "./tenant-rating.model";
import type { Types } from "mongoose";
import UserService from "../user/user.service";
import { RatingStatsHelper } from "@/utils/RatingStats";

export class TenantRatingService {
  static createRating = async (ratingDetails: ICreateTenantRatingDto) => {
    const { tenantId, landlordId, rating, comment } = ratingDetails;

    const userExist = await UserService.getUserDocumentById(tenantId);

    if (!userExist) {
      throw ApiError.notFound("User not found.");
    }
    const existingRating = await TenantRating.findOne({
      landlord: landlordId,
      tenant: tenantId,
    });
    if (existingRating) {
      const oldRating = existingRating.rating;
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
      await RatingStatsHelper.update(userExist, oldRating, rating);
      return ApiSuccess.created("Rating updated successfully", existingRating);
    }

    const newRating = await TenantRating.create({
      landlord: landlordId,
      tenant: tenantId,
      rating,
      comment,
    });
    await newRating.save();

    await RatingStatsHelper.update(userExist, undefined, rating);
    // await UserService.calculateAVerageRatingonRatingCreated(landlordId, rating);
    return ApiSuccess.created("Rating updated successfully", newRating);
  };

  static updateRating = async (ratingDetails: ICreateTenantRatingDto) => {
    const userExist = await UserService.getUserDocumentById(
      ratingDetails.tenantId
    );

    if (!userExist) {
      throw ApiError.notFound("User not found.");
    }
    const existingRating = await TenantRating.findOne({
      landlord: ratingDetails.landlordId,
      tenant: ratingDetails.tenantId,
    });

    if (!existingRating) {
      throw ApiError.notFound("Rating not found for this user.");
    }

    const landlordId = ratingDetails.landlordId;
    const oldRating = existingRating.rating;
    const newRatingValue = ratingDetails.rating ?? oldRating;

    existingRating.rating = newRatingValue;
    if (ratingDetails.comment) existingRating.comment = ratingDetails.comment;
    await existingRating.save();

    const newRating = ratingDetails.rating;
    await RatingStatsHelper.update(userExist, oldRating, newRating);
    await UserService.calculateAVerageRatingonRatingUpdated(
      landlordId,
      oldRating,
      newRatingValue
    );
    return ApiSuccess.ok("Rating updated successfully", existingRating);
  };

  static deleteRating = async (Id: string) => {
    const existingRating = await TenantRating.findOne({
      _id: Id,
    });
    if (!existingRating) {
      throw ApiError.notFound("Rating not found for this user.");
    }

    const landlordId = existingRating.landlord._id;
    const deletedRating = existingRating.rating;

    await TenantRating.deleteOne({
      _id: Id,
    });

    const user = await UserService.getUserDocumentById(
      existingRating.tenant._id as string
    );
    await RatingStatsHelper.update(user, existingRating.rating, undefined);
    await UserService.calculateAVerageRatingonRatingDeleted(
      landlordId as string,
      deletedRating
    );

    return ApiSuccess.ok("Rating deleted successfully");
  };

  static getRatingById = async (ratingId: string) => {
    const rating = await TenantRating.findOne({
      _id: ratingId,
    })
      .populate("tenantId")
      .populate("landlordId");
    if (!rating) {
      throw ApiError.notFound("Rating not found.");
    }
    return ApiSuccess.ok("Rating retrieved successfully", rating);
  };

  static getAllRatingsByLandlordId = async (landlordId: Types.ObjectId) => {
    const ratings = await TenantRating.find({ landlordId: landlordId });
    if (ratings.length === 0) {
      throw ApiError.notFound("No ratings found for this landlord.");
    }
    return ApiSuccess.ok("Ratings retrieved successfully", ratings);
  };

  static getAllRatings = async () => {
    const ratings = await TenantRating.find({});

    if (ratings.length === 0) {
      throw ApiError.notFound("No ratings found for this landlord.");
    }
    return ApiSuccess.ok("Ratings retrieved successfully", ratings);
  };
}
