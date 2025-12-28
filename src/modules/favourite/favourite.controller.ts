import type { Request, Response } from "express";
import { FavouriteService } from "./favourite.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";

export class FavouriteController {
  // Create favourite
  static async createFavourite(req: Request, res: Response) {
    const favouriteData = req.body;
    const { userId } = req.user as AuthenticatedUser;

    const result = await FavouriteService.createFavourite({
      ...favouriteData,
      user: userId,
    });

    res.status(201).json(result);
  }

  // Get favourite by ID
  static async getFavouriteById(req: Request, res: Response) {
    const { favouriteId } = req.params;
    const result = await FavouriteService.getFavouriteById(
      favouriteId as string
    );
    res.status(200).json(result);
  }

  // Get all favourites
  static async getAllFavourites(req: Request, res: Response) {
    const result = await FavouriteService.getAllFavourites();
    res.status(200).json(result);
  }

  // Get all favourites for a user
  static async getUserFavourites(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await FavouriteService.getUserFavourites(userId);
    res.status(200).json(result);
  }

  // Check if property is favourited by user
  static async isFavourited(req: Request, res: Response) {
    const { propertyId } = req.params;
    const { userId } = req.user as AuthenticatedUser;

    const result = await FavouriteService.isFavourited(
      userId,
      propertyId as string
    );

    res.status(200).json({ favourited: result });
  }

  // Delete favourite (using user + property)
  static async deleteFavourite(req: Request, res: Response) {
    const { propertyId } = req.params;
    const { userId } = req.user as AuthenticatedUser;

    const result = await FavouriteService.deleteFavourite(
      userId,
      propertyId as string
    );

    res.status(200).json(result);
  }
}
