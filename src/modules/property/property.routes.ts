import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { PropertyController } from "./property.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { PropertySchemas } from "./property.schema.js";

const router = express.Router();

router
  .route("/")
  .get(PropertyController.getProperties) // public or protected as needed
  .post(
    isAuth,
    PropertySchemas.validateImages,
    validateBody(PropertySchemas.createPropertySchema),
    PropertyController.createProperty
  )
  .all(methodNotAllowed);

router
  .route("/landlord")
  .get(isAuth, PropertyController.getAllLandlordProperties) // public or protected as needed
  .all(methodNotAllowed);

router
  .route("/:propertyId")
  .get(PropertyController.getPropertyById) // public or protected as needed
  .patch(
    isAuth,
    PropertySchemas.validateUpdateImages,
    validateBody(PropertySchemas.updatePropertySchema),
    PropertyController.updateProperty
  )
  .delete(isAuth, PropertyController.deleteProperty)
  .all(methodNotAllowed);

export default router;
