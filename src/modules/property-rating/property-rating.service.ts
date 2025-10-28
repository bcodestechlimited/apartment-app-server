import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import type { Types } from "mongoose";
import type { IPropertyRating } from "./property-rating.interface";
import PropertyRating from "./property-rating.model";
import UserService from "../user/user.service";

export class PropertyRatingService {
  static createRating = async (
    ratingDetails: IPropertyRating,
    roles: string[]
  ) => {
    const { propertyId, tenantId, rating, comment } = ratingDetails;
    if (!roles.includes("tenant")) {
      throw ApiError.badRequest("Only tenant can rate this property.");
    }
    const existingUser = await UserService.findUserById(tenantId);
    if (!existingUser) {
      throw ApiError.notFound("User not found.");
    }

    const existingRating = await PropertyRating.findOne({
      propertyId: ratingDetails.propertyId,
      tenantId: ratingDetails.tenantId,
    });
    if (existingRating) {
      throw ApiError.badRequest("Rating already exists for this property.");
    }
    const newRating = new PropertyRating(ratingDetails);

    await newRating.save();
    return ApiSuccess.created("Rating created successfully", newRating);
  };

  static updateRating = async (
    ratingDetails: IPropertyRating,
    roles: string[]
  ) => {
    console.log("entering update rating");
    if (!roles.includes("tenant")) {
      throw ApiError.badRequest("Only tenant can rate this property.");
    }
    const existingRating = await PropertyRating.findOne({
      propertyId: ratingDetails.propertyId,
      tenantId: ratingDetails.tenantId,
    });

    if (!existingRating) {
      throw ApiError.notFound("Rating not found for this property.");
    }
    existingRating.rating = ratingDetails.rating;
    existingRating.comment = ratingDetails.comment;
    existingRating.updatedAt = new Date();
    await existingRating.save();
    return ApiSuccess.ok("Rating updated successfully", existingRating);
  };

  static deleteRating = async (ratingId: string) => {
    const existingRating = await PropertyRating.findOne({
      _id: ratingId,
    });
    if (!existingRating) {
      throw ApiError.notFound("Rating not found for this property.");
    }
    await PropertyRating.deleteOne({
      _id: ratingId,
    });

    return ApiSuccess.ok("Rating deleted successfully");
  };

  static getRatingById = async (
    ratingId: string,
    tenantId: Types.ObjectId,
    roles: string[]
  ) => {
    const rating = await PropertyRating.findOne({
      _id: ratingId,
    });
    if (!rating) {
      throw ApiError.notFound("Rating not found for this property.");
    }
    return ApiSuccess.ok("Rating retrieved successfully", rating);
  };

  static getAllRatings = async (propertyId: string, roles: string[]) => {
    if (!roles.includes("tenant")) {
      throw ApiError.badRequest("Unauthorized access.");
    }
    const ratings = await PropertyRating.find({ propertyId: propertyId });

    if (ratings.length === 0) {
      throw ApiError.notFound("Unauthorized access.");
    }

    return ApiSuccess.ok("Ratings retrieved successfully", ratings);
  };
}
