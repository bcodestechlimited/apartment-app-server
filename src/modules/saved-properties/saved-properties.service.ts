import SavedProperties from "@/modules/saved-properties/saved-properties.model";
import type { ISavedProperties } from "@/modules/saved-properties/saved-properties.interface";
import type { ObjectId, Types } from "mongoose";
import { ApiSuccess } from "@/utils/responseHandler";
import { paginate } from "@/utils/paginate";
import UserService from "../user/user.service";

export class SavedPropertiesService {
  /**
   * Create a new saved property record
   */
  static async saveProperty(data: {
    userId: Types.ObjectId;
    propertyId: Types.ObjectId;
  }) {
    const result = await SavedProperties.create({
      user: data.userId, // <- must match schema
      property: data.propertyId, // <- must match schema
    });

    await UserService.addToSavedProperties(data.userId, data.propertyId);

    return ApiSuccess.ok("Property saved successfully");
  }

  /**
   * Get all saved properties for a user
   */
  static async getUserSavedProperties(userId: Types.ObjectId) {
    const { documents: properties, pagination } = await paginate({
      model: SavedProperties,
      query: {
        user: userId,
      },
      sort: { createdAt: -1 },
      populateOptions: [{ path: "property" }],
    });

    return ApiSuccess.ok("Properties retrieved successfully", {
      properties,
      pagination,
    });
  }

  /**
   * Get a single saved property by ID
   */
  static async getSavedPropertyById(id: string) {
    return await SavedProperties.findById(id)
      .populate("property")
      .populate("user");
  }

  /**
   * Delete a saved property by ID
   */
  static async deleteSavedProperty(id: string) {
    return await SavedProperties.findByIdAndDelete(id);
  }

  /**
   * Check if a property is already saved by a user
   */
  static async isPropertySavedByUser(
    userId: Types.ObjectId,
    propertyId: string
  ) {
    return await SavedProperties.exists({ user: userId, property: propertyId });
  }

  /**
   * Remove a saved property based on user + property (toggle unfavorite)
   */
  static async removeByUserAndProperty(
    userId: Types.ObjectId,
    propertyId: string
  ) {
    const result = await SavedProperties.findOneAndDelete({
      user: userId,
      property: propertyId,
    });
    await UserService.removeFromSavedProperties(userId, propertyId);

    return result;
  }
}
