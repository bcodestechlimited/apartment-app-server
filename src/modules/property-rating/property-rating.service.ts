import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import type { Types } from "mongoose";
import type { IPropertyRating } from "./property-rating.interface";
import PropertyRating from "./property-rating.model";
import UserService from "../user/user.service";
import { PropertyService } from "../property/property.service";

export class PropertyRatingService {
  static createRating = async (ratingDetails: IPropertyRating) => {
    const { propertyId, tenantId, rating, comment } = ratingDetails;
    const isBookedBy = await PropertyService.isBookedBy(tenantId);
    if (!isBookedBy) {
      throw ApiError.badRequest("This property is not booked by this user.");
    }

    const existingRating = await PropertyRating.findOne({
      propertyId,
      tenantId,
    });
    if (existingRating) {
      throw ApiError.badRequest("Rating already exists for this property.");
    }
    const newRating = await PropertyRating.create({
      propertyId,
      tenantId,
      rating,
      comment,
    });

    await PropertyService.calculateAVerageRatingOnRatingCreated(
      propertyId.toString(),
      rating
    );
    return ApiSuccess.created("Rating created successfully", newRating);
  };

  static updateRating = async (
    ratingDetails: IPropertyRating,
    roles: string[]
  ) => {
    const existingRating = await PropertyRating.findOne({
      propertyId: ratingDetails.propertyId,
      tenantId: ratingDetails.tenantId,
    });

    if (!existingRating) {
      throw ApiError.notFound("Rating not found for this property.");
    }
    const oldRating = existingRating.rating;
    existingRating.rating = ratingDetails.rating;
    existingRating.comment = ratingDetails.comment;
    existingRating.updatedAt = new Date();

    await existingRating.save();

    await PropertyService.calculateAVerageRatingOnRatingUpdated(
      ratingDetails.propertyId.toString(),
      oldRating,
      ratingDetails.rating
    );
    return ApiSuccess.ok("Rating updated successfully", existingRating);
  };

  static deleteRating = async (ratingId: string) => {
    const existingRating = await PropertyRating.findById(ratingId);
    if (!existingRating) {
      throw ApiError.notFound("Rating not found for this property.");
    }

    const { propertyId, rating } = existingRating;
    await PropertyRating.deleteOne({
      _id: ratingId,
    });

    await PropertyService.calculateAVerageRatingOnRatingDeleted(
      propertyId.toString(),
      rating
    );

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
  static getRatingByPropertyId = async (propertyId: string) => {
    console.log("entering here");
    const ratings = await PropertyRating.find({
      propertyId: propertyId,
    }).populate("tenantId");
    console.log(ratings);
    if (ratings.length === 0) {
      throw ApiError.notFound("No ratings found for this property.");
    }
    return ApiSuccess.ok("Ratings retrieved successfully", ratings);
  };
}
