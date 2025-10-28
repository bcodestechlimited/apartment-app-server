import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import type {
  ICreateLandlordRatingDto,
  ILandlordRating,
} from "./landlord-rating.interface";
import LandlordRating from "./landlord-rating.model";
import type { Types } from "mongoose";
import UserService from "../user/user.service";

export class LandlordRatingService {
  static createRating = async (ratingDetails: ICreateLandlordRatingDto) => {
    const { tenantId, landlordId, rating, comment } = ratingDetails;

    const userExist = await UserService.findUserById(tenantId);

    if (!userExist) {
      throw ApiError.notFound("User not found.");
    }
    const existingRating = await LandlordRating.findOne({
      landlord: landlordId,
      tenant: tenantId,
    });
    if (existingRating) {
      throw ApiError.notFound("Rating already exists for this user.");
    }

    const newRating = new LandlordRating({
      landlord: landlordId,
      tenant: tenantId,
      rating: rating,
      comment: comment,
    });

    await newRating.save();
    return ApiSuccess.created("Rating created successfully", newRating);
  };

  static updateRating = async (ratingDetails: ICreateLandlordRatingDto) => {
    const userExist = await UserService.findUserById(ratingDetails.tenantId);

    if (!userExist) {
      throw ApiError.notFound("User not found.");
    }
    const existingRating = await LandlordRating.findOne({
      landlord: ratingDetails.landlordId,
      tenant: ratingDetails.tenantId,
    });

    if (!existingRating) {
      throw ApiError.notFound("Rating not found for this user.");
    }
    existingRating.rating = ratingDetails.rating;
    existingRating.comment = ratingDetails.comment;

    await existingRating.save();
    return ApiSuccess.ok("Rating updated successfully", existingRating);
  };

  static deleteRating = async (Id: string) => {
    const existingRating = await LandlordRating.findOne({
      _id: Id,
    });
    if (!existingRating) {
      throw ApiError.notFound("Rating not found for this user.");
    }
    await LandlordRating.deleteOne({
      _id: Id,
    });

    return ApiSuccess.ok("Rating deleted successfully");
  };

  static getRatingById = async (ratingId: string) => {
    const rating = await LandlordRating.findOne({
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
    const ratings = await LandlordRating.find({ landlordId: landlordId });
    if (ratings.length === 0) {
      throw ApiError.notFound("No ratings found for this landlord.");
    }
    return ApiSuccess.ok("Ratings retrieved successfully", ratings);
  };

  static getAllRatings = async () => {
    const ratings = await LandlordRating.find({});

    if (ratings.length === 0) {
      throw ApiError.notFound("No ratings found for this landlord.");
    }
    return ApiSuccess.ok("Ratings retrieved successfully", ratings);
  };
}
