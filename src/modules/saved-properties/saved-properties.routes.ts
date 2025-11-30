import { Router } from "express";
import { SavedPropertiesController } from "./saved-properties.controller";
import { isAuth } from "@/middleware/auth";

const router = Router();

// Save a property
router.post("/", isAuth, SavedPropertiesController.saveProperty);

// Get all saved properties for a user
router.get("/user", isAuth, SavedPropertiesController.getUserSavedProperties);

// Get a saved property by ID
router.get("/:id", SavedPropertiesController.getSavedPropertyById);

// Delete saved property by ID
router.delete("/:id", SavedPropertiesController.deleteSavedProperty);

// Remove saved property with user + property (toggle unsave)
router.delete(
  "/remove/:propertyId",
  isAuth,
  SavedPropertiesController.removeByUserAndProperty
);

// Check if user saved property
router.get(
  "/check/:userId/:propertyId",
  SavedPropertiesController.checkIfSaved
);

export default router;
