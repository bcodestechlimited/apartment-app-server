import Property from "./property.model.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import {
  PropertyType,
  type CreatePropertyDTO,
  type UpdatePropertyDTO,
} from "./property.interface.js";
import type { ObjectId } from "mongoose";
import { UploadService } from "../../services/upload.service.js";
import type { UploadedFile } from "express-fileupload";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
import { paginate } from "../../utils/paginate.js";

export class PropertyService {
  static async getPropertyDocumentById(propertyId: string | ObjectId) {
    const property = await Property.findOne({ _id: propertyId }).populate(
      "user",
      "-password"
    );
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    return property;
  }
  static getActualTypeFromParam(type: string): string | undefined {
    if (!type || type.toLowerCase() === "all") {
      return undefined;
    }

    const propertyTypes: Record<string, PropertyType> = {
      serviced: PropertyType.SERVICED_APARTMENT,
      shared: PropertyType.SHARED_APARTMENT,
      standard: PropertyType.STANDARD_RENTAL,
      "short-let": PropertyType.SHORT_LETS,
      "co-working-space": PropertyType.CO_WORKING_SPACE,
    };

    return propertyTypes[type];
  }

  // Create new property
  static async createProperty(
    propertyData: CreatePropertyDTO,
    files: any,
    userId: ObjectId
  ) {
    const parsedAmenities = JSON.parse(propertyData.amenities);
    const parsedFacilities = JSON.parse(propertyData.facilities);
    propertyData.amenities = parsedAmenities;
    propertyData.facilities = parsedFacilities;

    console.log({ propertyData });

    const { pictures } = files;
    const property = new Property({ ...propertyData, user: userId });

    const uploadedPictures = await Promise.all(
      pictures.map(async (picture: UploadedFile) => {
        const { secure_url } = await UploadService.uploadToCloudinary(
          picture.tempFilePath
        );
        return secure_url;
      })
    );

    property.pictures = uploadedPictures as string[];
    await property.save();
    return ApiSuccess.created("Property created successfully", { property });
  }
  // Get all properties
  static async getAllProperties(query: IQueryParams) {
    const { limit = 10, page = 1, type } = query;

    const filterQuery: Record<string, any> = {};
    if (type) {
      const propertyType = PropertyService.getActualTypeFromParam(type);
      console.log({ propertyType });

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
  static async getLandlordProperties(
    userId: string | ObjectId,
    query: IQueryParams
  ) {
    const { limit = 10, page = 1, type } = query;

    const filterQuery: Record<string, any> = {};

    if (type) {
      const propertyType = PropertyService.getActualTypeFromParam(type);
      console.log({ propertyType });

      if (propertyType) {
        filterQuery.type = propertyType;
      }
    }

    filterQuery.user = userId;

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
    console.log({ id });

    const property = await Property.findById(id).populate("user", "-password");
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    return ApiSuccess.ok("Property retrieved successfully", { property });
  }

  // Update property
  static async updateProperty(
    id: string,
    updateData: UpdatePropertyDTO,
    userId: ObjectId
  ) {
    const property = await Property.findById(id);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    // Optionally enforce ownership
    if (property.user.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to update this property"
      );
    }

    Object.assign(property, updateData);
    await property.save();

    return ApiSuccess.ok("Property updated successfully", { property });
  }

  // Delete property
  static async deleteProperty(id: string, userId: ObjectId) {
    const property = await Property.findById(id);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    if (property.user.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to delete this property"
      );
    }

    await property.deleteOne();

    return ApiSuccess.ok("Property deleted successfully");
  }
}

export const propertyService = new PropertyService();
