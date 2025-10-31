import Property from "./property.model.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import {
  PropertyType,
  type CreatePropertyDTO,
  type UpdatePropertyDTO,
} from "./property.interface.js";
import type { ObjectId, Types } from "mongoose";
import { UploadService } from "../../services/upload.service.js";
import type { UploadedFile } from "express-fileupload";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
import { paginate } from "../../utils/paginate.js";

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
    files: { pictures: UploadedFile[] },
    userId: Types.ObjectId
  ) {
    const parsedAmenities = JSON.parse(propertyData.amenities);
    const parsedFacilities = JSON.parse(propertyData.facilities);
    propertyData.amenities = parsedAmenities;
    propertyData.facilities = parsedFacilities;

    const isAvailable = new Date(propertyData.availabilityDate) <= new Date();

    const { pictures } = files;

    const property = new Property({
      ...propertyData,
      seatingCapacity: Number(propertyData.seatingCapacity) || 1,
      user: userId,
      isAvailable: isAvailable,
      isVerified: false,
    });

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
  // Get all properties (admin)
  static async getAllProperties(query: IQueryParams) {
    const {
      limit = 10,
      page = 1,
      propertyType,
      minPrice,
      maxPrice,
      state,
      lga,
      numberOfBedrooms,
      numberOfBathrooms,
    } = query;

    console.log({ numberOfBedrooms, numberOfBathrooms });

    const filterQuery: Record<string, any> = {};

    // const filterQuery: Record<string, any> = {
    //   isAvailable: true,
    //   isApproved: true,
    // };

    if (propertyType) {
      const actualPropertyType =
        PropertyService.getActualTypeFromParam(propertyType);

      console.log({ actualPropertyType });

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

    console.log({ filterQuery });

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
  // Get all properties
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
    } = query;

    const filterQuery: Record<string, any> = {};

    // const filterQuery: Record<string, any> = {
    //   isAvailable: true,
    //   isApproved: true,
    // };

    if (propertyType) {
      const actualPropertyType =
        PropertyService.getActualTypeFromParam(propertyType);

      console.log({ actualPropertyType });

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

    if (pricingModel) {
      filterQuery.pricingModel = pricingModel.toLowerCase();
    }

    if (search) {
      filterQuery.title = { $regex: search, $options: "i" };
    }

    // if (availableFrom) {
    //   const isoDate = toISODate(availableFrom as string);

    //   console.log({ isoDate });

    //   if (isoDate) {
    //     filterQuery.availabilityDate = {
    //       $gte: isoDate,
    //     };
    //   }
    // }

    console.log({ filterQuery });

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
    query: IQueryParams
  ) {
    const { limit = 10, page = 1, type } = query;
    const filterQuery: Record<string, any> = { user: userId };

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
    return ApiSuccess.ok("Property retrieved successfully", { property });
  }

  // Update property
  static async updateProperty(
    propertyId: string,
    updateData: Partial<UpdatePropertyDTO>,
    userId: Types.ObjectId | string,
    files?: { newPictures: UploadedFile | UploadedFile[] }
  ) {
    const { newPictures } = files ?? {};

    const property = await Property.findById(propertyId);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    // Optionally enforce ownership
    if (String(property.user._id) !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to update this property"
      );
    }

    console.log({ updateData });

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
      isVerified: false,
    };

    if (newPictures && Array.isArray(newPictures) && newPictures.length > 0) {
      const length = newPictures.length;
      if (parsedExistingPictures.length + length > 5) {
        throw ApiError.badRequest("You can only upload a maximum of 5 images");
      }
      const newlyUploadedPictures = await Promise.all(
        newPictures.map(async (picture: UploadedFile) => {
          const { secure_url } = await UploadService.uploadToCloudinary(
            picture.tempFilePath
          );
          return secure_url;
        })
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
        newPictures.tempFilePath
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
  static async adminUpdateProperty(
    propertyId: string,
    updateData: Partial<UpdatePropertyDTO>,
    files?: { newPictures: UploadedFile | UploadedFile[] }
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
            picture.tempFilePath
          );
          return secure_url;
        })
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
        newPictures.tempFilePath
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
        "You do not have permission to delete this property"
      );
    }

    await property.deleteOne();

    return ApiSuccess.ok("Property deleted successfully");
  }

  static async addToBookedBy(
    userId: ObjectId | string,
    propertyId: ObjectId | string
  ) {
    const property = await Property.findOneAndUpdate(
      { _id: propertyId },
      { $addToSet: { bookedBy: userId } },
      { new: true }
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
    tenantId: string
  ) {
    await Property.findByIdAndUpdate(propertyId, {
      $pull: { requestedBy: tenantId },
    });
  }
}

export const propertyService = new PropertyService();
