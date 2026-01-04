import { isAuth, isTenant } from "@/middleware/auth";
import { validateBody, validateParams } from "@/middleware/validateSchema";
import { Router } from "express";
import { LandlordRatingSchema } from "./landlord-rating.schema";
import { LandlordRatingController } from "./landlord-rating.controller";

const landlordRatingRouter = Router();

landlordRatingRouter
  .route("/")
  //   .get(isAuth, isTenant)
  .post(
    isAuth,
    isTenant,
    validateBody(LandlordRatingSchema.createLandlordRatingSchema),
    LandlordRatingController.createRating
  )
  .put(
    isAuth,
    isTenant,
    validateBody(LandlordRatingSchema.updateLandlordRatingSchema),

    LandlordRatingController.updateRating
  );

landlordRatingRouter
  .route("/:ratingId")
  .get(
    isAuth,
    isTenant,
    validateParams(LandlordRatingSchema.idParams("ratingId", "id")),
    LandlordRatingController.getRatingById
  )

  .delete(
    isAuth,
    isTenant,
    validateBody(LandlordRatingSchema.idParams("ratingId", "id")),
    LandlordRatingController.deleteRating
  );

export default landlordRatingRouter;
