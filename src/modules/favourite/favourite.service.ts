/* eslint-disable @typescript-eslint/no-explicit-any */
import Favourite from "./favourite.model";
import type { ICreateFavouriteDto } from "./favourite.interface";
import mongoose from "mongoose";

export class FavouriteService {
  static async createFavourite(favouriteDetails: ICreateFavouriteDto) {
    const { user, property } = favouriteDetails;

    // Prevent duplicate favourites
    const exists = await Favourite.findOne({ user, property });
    if (exists) {
      return { message: "Property already favourited", favourite: exists };
    }

    const favourite = await Favourite.create({ user, property });
    return favourite;
  }

  static async getUserFavourites(userId: string | mongoose.Types.ObjectId) {
    const favourites = await Favourite.find({ user: userId })
      .populate("property") // optional — remove if you only need IDs
      .sort({ createdAt: -1 });

    return favourites;
  }

  static async isFavourited(
    userId: string | mongoose.Types.ObjectId,
    propertyId: string | mongoose.Types.ObjectId
  ) {
    const favourite = await Favourite.findOne({
      user: userId,
      property: propertyId,
    });

    return favourite ? true : false;
  }

  static async deleteFavourite(
    userId: string | mongoose.Types.ObjectId,
    propertyId: string | mongoose.Types.ObjectId
  ) {
    const deleted = await Favourite.findOneAndDelete({
      user: userId,
      property: propertyId,
    });

    return deleted;
  }

  static async getFavouriteById(favouriteId: string) {
    const favourite = await Favourite.findById(favouriteId).populate(
      "property"
    );

    return favourite;
  }

  static async getAllFavourites() {
    const favourites = await Favourite.find()
      .populate("user")
      .populate("property");

    return favourites;
  }
}
