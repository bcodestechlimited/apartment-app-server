import Property from "./property.model.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import type {
  CreatePropertyDTO,
  UpdatePropertyDTO,
} from "./property.interface.js";
import type { ObjectId } from "mongoose";

export class PropertyService {
  // Create new property
  static async createProperty(propertyData: CreatePropertyDTO) {
    const property = new Property(propertyData);
    await property.save();

    return ApiSuccess.created("Property created successfully", { property });
  }

  // Get all properties
  static async getAllProperties() {
    const properties = await Property.find().populate("user", "-password");
    return ApiSuccess.ok("Properties retrieved successfully", { properties });
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
