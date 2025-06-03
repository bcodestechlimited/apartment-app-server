import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { PropertyController } from "./property.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { PropertySchemas } from "./property.schema.js";

const router = express.Router();

router
  .route("/")
  .get(PropertyController.getAllProperties) // public or protected as needed
  .post(
    isAuth,
    PropertySchemas.validateImages,
    // validateBody(PropertySchemas.create),
    PropertyController.createProperty
  )
  .all(methodNotAllowed);

router
  .route("/:id")
  .get(PropertyController.getPropertyById) // public or protected as needed
  .patch(
    isAuth,
    validateBody(PropertySchemas.update),
    PropertyController.updateProperty
  )
  .delete(isAuth, PropertyController.deleteProperty)
  .all(methodNotAllowed);

export default router;
