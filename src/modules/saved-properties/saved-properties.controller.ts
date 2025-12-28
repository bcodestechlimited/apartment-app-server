import type { Request, Response } from "express";
import { SavedPropertiesService } from "./saved-properties.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";

export class SavedPropertiesController {
  // Save a property for the authenticated user
  static async saveProperty(req: Request, res: Response) {
    const { propertyId } = req.body;
    const { userId } = req.user as AuthenticatedUser;
    console.log("save properties details", { propertyId, userId });
    const result = await SavedPropertiesService.saveProperty({
      userId,
      propertyId,
    });

    res.status(201).json(result);
  }

  // Get authenticated user's saved properties
  static async getUserSavedProperties(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    console.log("userId", userId);
    const result = await SavedPropertiesService.getUserSavedProperties(userId);

    res.status(200).json(result);
  }

  // Get a single saved property by ID
  static async getSavedPropertyById(req: Request, res: Response) {
    const { id } = req.params;

    const result = await SavedPropertiesService.getSavedPropertyById(
      id as string
    );

    res.status(200).json(result);
  }

  // Delete a saved property by its record ID
  static async deleteSavedProperty(req: Request, res: Response) {
    const { id } = req.params;
    const { userId } = req.user as AuthenticatedUser;

    const result = await SavedPropertiesService.deleteSavedProperty(
      id as string
    );

    res.status(200).json(result);
  }

  // Remove saved property using user + property (toggle unsave)
  static async removeByUserAndProperty(req: Request, res: Response) {
    const { propertyId } = req.params;
    const { userId } = req.user as AuthenticatedUser;

    const result = await SavedPropertiesService.removeByUserAndProperty(
      userId,
      propertyId as string
    );

    res.status(200).json(result);
  }

  // Check if property is saved by authenticated user
  static async checkIfSaved(req: Request, res: Response) {
    const { propertyId } = req.params;
    const { userId } = req.user as AuthenticatedUser;

    const exists = await SavedPropertiesService.isPropertySavedByUser(
      userId,
      propertyId as string
    );

    res.status(200).json({ saved: Boolean(exists) });
  }
}
