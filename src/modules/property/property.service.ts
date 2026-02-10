import Property from "./property.model.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import {
  PropertyType,
  type CreatePropertyDTO,
  type UpdatePropertyDTO,
} from "./property.interface.js";
import type { ClientSession, ObjectId, Types } from "mongoose";
import { UploadService } from "../../services/upload.service.js";
import type { UploadedFile } from "express-fileupload";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
import { paginate } from "../../utils/paginate.js";
import { TenantService } from "../tenant/tenant.service.js";
import UserService from "../user/user.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";
import agenda from "@/lib/agenda.js";
import { PROPERTY_UPDATE_ALERT } from "@/jobs/sendPropertyUpdateAlert.js";

export class PropertyService {
  static async getPropertyDocumentById(propertyId: string | ObjectId) {
    const property = await Property.findOne({ _id: propertyId }).populate([
      {
        path: "user",
        select: "-password",
      },
    ]);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    return property;
  }
  static getActualTypeFromParam(type: string | undefined): string | undefined {
    if (!type || type.toLowerCase() === "all") {
      return undefined;
    }

    const propertyTypes: Record<string, PropertyType> = {
      serviced: PropertyType.SERVICED_APARTMENT,
      "serviced-apartment": PropertyType.SERVICED_APARTMENT,
      shared: PropertyType.SHARED_APARTMENT,
      "shared-apartment": PropertyType.SHARED_APARTMENT,
      standard: PropertyType.STANDARD_RENTAL,
      "standard-rental": PropertyType.STANDARD_RENTAL,
      "short-let": PropertyType.SHORT_LETS,
      "co-working-space": PropertyType.CO_WORKING_SPACE,
    };

    return (
      propertyTypes[type] || propertyTypes[type.toLowerCase().replace(" ", "-")]
    );
  }

  // Create new property
  static async createProperty(
    propertyData: CreatePropertyDTO,
    // files: { pictures: UploadedFile[] },
    userId: Types.ObjectId,
  ) {
    const amenities =
      typeof propertyData.amenities === "string"
        ? JSON.parse(propertyData.amenities)
        : propertyData.amenities;

    const facilities =
      typeof propertyData.facilities === "string"
        ? JSON.parse(propertyData.facilities)
        : propertyData.facilities;

    let parsedOtherFees = [];
    if (propertyData.otherFees) {
      try {
        parsedOtherFees =
          typeof propertyData.otherFees === "string"
            ? JSON.parse(propertyData.otherFees)
            : propertyData.otherFees;
      } catch (error) {
        throw new ApiError(400, "Invalid format for 'Other Fees'.");
      }
    }

    const isAvailable = new Date(propertyData.availabilityDate) <= new Date();

    // const { pictures } = files;

    const property = new Property({
      ...propertyData,
      amenities,
      facilities,
      otherFees: parsedOtherFees,
      seatingCapacity: Number(propertyData.seatingCapacity) || 1,
      user: userId,
      isAvailable: isAvailable,
      isVerified: false,
    });

    // const uploadedPictures = await Promise.all(
    //   pictures.map(async (picture: UploadedFile) => {
    //     const { secure_url } = await UploadService.uploadToCloudinary(
    //       picture.tempFilePath,
    //     );
    //     return secure_url;
    //   }),
    // );

    // property.pictures = propertyData.pictures as string[];
    await property.save();

    await UserService.updateLandlordStats(userId, { propertiesDelta: 1 });
    return ApiSuccess.created("Property created successfully", { property });
  }

  static async getAllProperties(query: IQueryParams) {
    const {
      limit = 10,
      page = 1,
      propertyType,
      minPrice,
      maxPrice,
      state,
      lga,
      search,
      numberOfBedrooms,
      numberOfBathrooms,
      isVerified,
    } = query;

    const filterQuery: Record<string, any> = { isDeleted: { $ne: true } };

    // const filterQuery: Record<string, any> = {
    //   isAvailable: true,
    //   isApproved: true,
    // };

    if (propertyType) {
      const actualPropertyType =
        PropertyService.getActualTypeFromParam(propertyType);

      if (actualPropertyType) {
        filterQuery.type = actualPropertyType;
      }
    }

    if (minPrice) {
      filterQuery.price = { $gte: Number(minPrice) };
    }

    if (maxPrice) {
      filterQuery.price = { ...filterQuery.price, $lte: Number(maxPrice) };
    }

    if (state) {
      filterQuery.state = state;
    }

    if (lga) {
      filterQuery.lga = lga;
    }

    if (numberOfBedrooms) {
      filterQuery.numberOfBedRooms = numberOfBedrooms;
    }

    if (numberOfBathrooms) {
      filterQuery.numberOfBathrooms = numberOfBathrooms;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };

      // Use $or to search across multiple fields
      filterQuery.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
        { state: searchRegex },
        { lga: searchRegex },
      ];
    }

    if (isVerified !== undefined) {
      filterQuery.isVerified = isVerified;
    }

    const { documents: properties, pagination } = await paginate({
      model: Property,
      query: filterQuery,
      page,
      limit,
      sort: { createdAt: -1 },
    });

    const totalListings = await Property.countDocuments();

    const totalActiveTenants = await UserService.totalActiveTenants();

    const verifiedLandlords = await UserService.verifiedLandlordsCount();

    const totalTenants = await UserService.totalTenantsCount();
    return ApiSuccess.ok("Properties retrieved successfully", {
      properties,
      pagination,
      meta: {
        totalListings,
        totalActiveTenants,
        verifiedLandlords,
        totalTenants,
      },
    });
  }

  static async getProperties(query: IQueryParams) {
    const {
      limit = 10,
      page = 1,
      search,
      propertyType,
      minPrice,
      maxPrice,
      state,
      lga,
      numberOfBedrooms,
      numberOfBathrooms,
      pricingModel,
      availableFrom,
      city,
    } = query;

    const filterQuery: Record<string, any> = { isDeleted: { $ne: true } };

    filterQuery.isVerified = true;

    if (propertyType) {
      const actualPropertyType =
        PropertyService.getActualTypeFromParam(propertyType);

      if (actualPropertyType) {
        filterQuery.type = actualPropertyType;
      }
    }

    if (minPrice) {
      filterQuery.price = { $gte: Number(minPrice) };
    }

    if (maxPrice) {
      filterQuery.price = { ...filterQuery.price, $lte: Number(maxPrice) };
    }

    if (state && state.trim()) {
      filterQuery.state = { $regex: state, $options: "i" };
    }

    if (lga && lga.trim()) {
      filterQuery.lga = { $regex: lga, $options: "i" };
    }

    // If city is provided, it searches within the LGA field
    if (city && city.trim()) {
      filterQuery.lga = { $regex: city, $options: "i" };
    }

    if (numberOfBedrooms) {
      filterQuery.numberOfBedrooms = numberOfBedrooms;
    }

    if (numberOfBathrooms) {
      filterQuery.numberOfBathrooms = numberOfBathrooms;
    }

    if (pricingModel) {
      filterQuery.pricingModel = pricingModel.toLowerCase();
    }

    if (search && search.trim()) {
      filterQuery.title = { $regex: search, $options: "i" };
    }

    const { documents: properties, pagination } = await paginate({
      model: Property,
      query: filterQuery,
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return ApiSuccess.ok("Properties retrieved successfully", {
      properties,
      pagination,
    });
  }

  static async getLandlordProperties(
    userId: string | Types.ObjectId,
    query: IQueryParams,
  ) {
    const { limit = 10, page = 1, type } = query;
    const filterQuery: Record<string, any> = {
      user: userId,
      isDeleted: { $ne: true },
    };

    if (type) {
      const propertyType = PropertyService.getActualTypeFromParam(type);
      if (propertyType) {
        filterQuery.type = propertyType;
      }
    }

    const { documents: properties, pagination } = await paginate({
      model: Property,
      query: filterQuery,
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return ApiSuccess.ok("Properties retrieved successfully", {
      properties,
      pagination,
    });
  }

  // Get single property by ID
  static async getPropertyById(id: string) {
    const property = await Property.findById(id).populate("user", "-password");
    if (!property) {
      throw ApiError.notFound("Property not found");
    }
    if (property.isDeleted) {
      throw ApiError.notFound("Property not found");
    }
    return ApiSuccess.ok("Property retrieved successfully", { property });
  }

  // Update property
  static async updateProperty(
    propertyId: string,
    updateData: Partial<UpdatePropertyDTO>,
    userId: Types.ObjectId | string,
    files?: { newPictures: UploadedFile | UploadedFile[] },
    isVerified?: boolean,
  ) {
    const { newPictures } = files ?? {};

    const property = await Property.findById(propertyId).populate("user");
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    // Optionally enforce ownership
    if (String(property.user._id) !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to update this property",
      );
    }

    const parsedExistingPictures = Array.isArray(updateData.existingPictures)
      ? updateData.existingPictures
      : JSON.parse((updateData.existingPictures as any) || "[]");

    const parsedAmenities = Array.isArray(updateData.amenities)
      ? updateData.amenities
      : JSON.parse((updateData.amenities as any) || "[]");

    const parsedFacilities = Array.isArray(updateData.facilities)
      ? updateData.facilities
      : JSON.parse((updateData.facilities as any) || "[]");

    let parsedOtherFees = property.otherFees || [];

    if (updateData.otherFees) {
      try {
        if (typeof updateData.otherFees === "string") {
          parsedOtherFees = JSON.parse(updateData.otherFees);
        } else {
          parsedOtherFees = updateData.otherFees;
        }
      } catch (error) {
        throw new ApiError(
          400,
          "Invalid format for 'Other Fees'. Please check your input.",
        );
      }
    }
    // property.otherFees = parsedOtherFees;

    let updatePropertyPayload = {
      ...updateData,
      amenities: parsedAmenities,
      facilities: parsedFacilities,
      pictures: parsedExistingPictures,
      otherFees: parsedOtherFees,
      isVerified: isVerified ?? false,
    };

    if (newPictures && Array.isArray(newPictures) && newPictures.length > 0) {
      const length = newPictures.length;
      if (parsedExistingPictures.length + length > 5) {
        throw ApiError.badRequest("You can only upload a maximum of 5 images");
      }
      const newlyUploadedPictures = await Promise.all(
        newPictures.map(async (picture: UploadedFile) => {
          const { secure_url } = await UploadService.uploadToCloudinary(
            picture.tempFilePath,
          );
          return secure_url;
        }),
      );

      updatePropertyPayload.pictures = [
        ...parsedExistingPictures,
        ...newlyUploadedPictures.filter((picture) => picture !== undefined),
      ];
    }

    if (newPictures && !Array.isArray(newPictures)) {
      if (parsedExistingPictures.length + 1 > 5) {
        throw ApiError.badRequest("You can only upload a maximum of 5 images");
      }

      const { secure_url } = await UploadService.uploadToCloudinary(
        newPictures.tempFilePath,
      );

      updatePropertyPayload.pictures = [
        ...parsedExistingPictures,
        secure_url as string,
      ];
    }

    Object.assign(property, updatePropertyPayload);
    await property.save();

    await agenda.now(PROPERTY_UPDATE_ALERT, {
      propertyId: propertyId,
      propertyTitle: property.title,
      landlordName: `${property.user.firstName} ${property.user.lastName}`,
    });

    return ApiSuccess.ok("Property updated successfully", { property });
  }
  static async adminUpdateProperty(
    propertyId: string,
    updateData: Partial<UpdatePropertyDTO>,
    files?: { newPictures: UploadedFile | UploadedFile[] },
  ) {
    const { newPictures } = files ?? {};

    const property = await Property.findById(propertyId);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    const parsedExistingPictures = updateData.existingPictures
      ? JSON.parse(updateData.existingPictures as string)
      : property.pictures || [];

    const parsedAmenities = updateData.amenities
      ? JSON.parse(updateData.amenities as string)
      : property.amenities || [];

    const parsedFacilities = updateData.facilities
      ? JSON.parse(updateData.facilities as string)
      : property.facilities || [];

    let updatePropertyPayload = {
      ...updateData,
      amenities: parsedAmenities,
      facilities: parsedFacilities,
      pictures: parsedExistingPictures,
    };

    if (newPictures && Array.isArray(newPictures) && newPictures.length > 0) {
      const length = newPictures.length;
      if (parsedExistingPictures.length + length > 5) {
        throw ApiError.badRequest("You can only upload a maximum of 5 images");
      }
      const newlyUploadedPictures = await Promise.all(
        newPictures.map(async (picture: UploadedFile) => {
          const { secure_url } = await UploadService.uploadToCloudinary(
            picture.tempFilePath,
          );
          return secure_url;
        }),
      );

      updatePropertyPayload.pictures = [
        ...parsedExistingPictures,
        ...newlyUploadedPictures.filter((picture) => picture !== undefined),
      ];
    }

    if (newPictures && !Array.isArray(newPictures)) {
      if (parsedExistingPictures.length + 1 > 5) {
        throw ApiError.badRequest("You can only upload a maximum of 5 images");
      }

      const { secure_url } = await UploadService.uploadToCloudinary(
        newPictures.tempFilePath,
      );

      updatePropertyPayload.pictures = [
        ...parsedExistingPictures,
        secure_url as string,
      ];
    }

    Object.assign(property, updatePropertyPayload);
    await property.save();

    return ApiSuccess.ok("Property updated successfully", { property });
  }

  // Delete property
  static async deleteProperty(id: string, userId: Types.ObjectId) {
    const property = await Property.findById(id);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    if (property.user.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to delete this property",
      );
    }

    await property.deleteOne();
    await UserService.updateLandlordStats(userId, { propertiesDelta: -1 });

    return ApiSuccess.ok("Property deleted successfully");
  }

  static async softDeleteProperty(id: string, userId: Types.ObjectId) {
    const property = await Property.findById(id);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    if (property.user.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to delete this property",
      );
    }
    property.isDeleted = true;
    await property.save();
    return ApiSuccess.ok("Property deleted successfully", { property });
  }

  static async addToBookedBy(
    userId: ObjectId | string,
    propertyId: ObjectId | string,
    session?: ClientSession,
  ) {
    const property = await Property.findOneAndUpdate(
      { _id: propertyId },
      { $addToSet: { bookedBy: userId } },
      { new: true, session },
    );

    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    return ApiSuccess.ok("Property booked successfully", { property });
  }

  static async isBookedBy(userId: Types.ObjectId) {
    console.log({ userId });
    const isBookedBy = await Property.findOne({
      bookedBy: { $in: [userId] },
    });
    if (!isBookedBy) {
      return false;
    }
    return true;
  }

  //Helpers

  static async pullTenantFromPropertyRequestedById(
    propertyId: string,
    tenantId: string,
  ) {
    await Property.findByIdAndUpdate(propertyId, {
      $pull: { requestedBy: tenantId },
    });
  }

  static async updatePropertyRevenue(
    propertyId: string | Types.ObjectId | ObjectId,
    amount: number,
    session?: ClientSession,
  ) {
    return await Property.findByIdAndUpdate(
      propertyId,
      {
        $inc: { totalRevenue: amount },
      },
      { session },
    );
  }

  static async calculateAVerageRatingOnRatingCreated(
    propertyId: string,
    newRating: number,
  ) {
    const property = await Property.findById(propertyId);
    if (!property) return;

    const { averageRating, totalRatings } = property;
    const newTotal = totalRatings + 1;
    const newAverage = (averageRating * totalRatings + newRating) / newTotal;

    property.averageRating = parseFloat(newAverage.toFixed(2));
    property.totalRatings = newTotal;
    await property.save();
  }

  static async calculateAVerageRatingOnRatingUpdated(
    propertyId: string,
    oldRating: number,
    newRating: number,
  ) {
    const property = await Property.findById(propertyId);
    if (!property) return;

    const { averageRating, totalRatings } = property;
    const newAverage =
      (averageRating * totalRatings - oldRating + newRating) / totalRatings;

    property.averageRating = parseFloat(newAverage.toFixed(2));
    await property.save();
  }

  static async calculateAVerageRatingOnRatingDeleted(
    propertyId: string,
    deletedRating: number,
  ) {
    const property = await Property.findById(propertyId);
    if (!property) return;

    const { averageRating, totalRatings } = property;
    if (totalRatings <= 1) {
      property.averageRating = 0;
      property.totalRatings = 0;
    } else {
      const newTotal = totalRatings - 1;
      const newAverage =
        (averageRating * totalRatings - deletedRating) / newTotal;

      property.averageRating = parseFloat(newAverage.toFixed(2));
      property.totalRatings = newTotal;
    }

    await property.save();
  }

  static async updatePropertyAvailability(
    propertyId: string,
    isAvailable: boolean,
  ) {
    const property = await Property.findById(propertyId);
    if (!property) return ApiError.notFound("Property not found");
    property.isAvailable = isAvailable;
    if (isAvailable) {
      property.availabilityDate = new Date();
    }
    await property.save();
    return ApiSuccess.ok("Property availability updated successfully", {
      property,
    });
  }
}

export const propertyService = new PropertyService();
