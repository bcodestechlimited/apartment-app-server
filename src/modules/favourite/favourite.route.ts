import { Router } from "express";
import { FavouriteController } from "./favourite.controller.js";

const router = Router();

// Create a favourite
router.post("/", FavouriteController.createFavourite);

// Get all favourites
router.get("/", FavouriteController.getAllFavourites);

// Get a single favourite by ID
router.get("/:favouriteId", FavouriteController.getFavouriteById);

// Get authenticated user's favourites
router.get("/user/me/list", FavouriteController.getUserFavourites);

// Check if a property is favourited by the authenticated user
router.get("/check/:propertyId", FavouriteController.isFavourited);

// Delete a favourite (user + property)
router.delete("/:propertyId", FavouriteController.deleteFavourite);

export default router;
