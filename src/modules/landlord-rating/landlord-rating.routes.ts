import { Router } from "express";
import { LandlordRatingController } from "./landlord-rating.controller";
import { isAuth, isLandlord } from "@/middleware/auth";
import { validateBody, validateParams } from "@/middleware/validateSchema";
import { LandlordRatingSchemas } from "./landlord-rating.schema";

const landlordRatingRouter = Router();
landlordRatingRouter
  .route("/")
  .post(
    isAuth,
    isLandlord,
    validateBody(LandlordRatingSchemas.createLandlordRatingSchema),
    LandlordRatingController.createRating
  )
  .put(
    isAuth,
    isLandlord,
    validateBody(LandlordRatingSchemas.updateLandlordRatingSchema),
    LandlordRatingController.updateRating
  )
  .get(isAuth, isLandlord, LandlordRatingController.getAllRatingsByLandlordId);

landlordRatingRouter
  .route("/:ratingId")
  .delete(
    isAuth,
    isLandlord,
    validateParams(LandlordRatingSchemas.idParams("ratingId", " id")),
    LandlordRatingController.deleteRating
  )
  .get(
    isAuth,
    isLandlord,
    validateParams(LandlordRatingSchemas.idParams("ratingId", "id")),

    LandlordRatingController.getRatingById
  );

export default landlordRatingRouter;
