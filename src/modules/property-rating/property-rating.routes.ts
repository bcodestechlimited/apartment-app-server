import { isAuth, isTenant } from "@/middleware/auth";
import { Router } from "express";
import { PropertyRatingController } from "./property-rating.controller";
import { validateBody } from "@/middleware/validateSchema";
import { PropertyRatingSchemas } from "./property-rating.schema";

const propertyRatingRouter = Router();

propertyRatingRouter
  .route("/")
  .post(
    isAuth,
    isTenant,
    validateBody(PropertyRatingSchemas.createPropertyRatingSchema),
    PropertyRatingController.createRating
  )
  .put(
    isAuth,
    isTenant,
    validateBody(PropertyRatingSchemas.updatePropertyRatingSchema),
    PropertyRatingController.updateRating
  )
  .get(isAuth, isTenant, PropertyRatingController.getAllRatings);

// propertyRatingRouter
//   .route("/:ratingId")
//   .delete(isAuth, PropertyRatingController.deleteRating)
//   .get(isAuth, PropertyRatingController.getRatingById);

propertyRatingRouter
  .route("/:propertyId")
  .get(isAuth, PropertyRatingController.ratingByPropertyId);

export default propertyRatingRouter;
