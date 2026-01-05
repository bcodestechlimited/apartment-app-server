import { Router } from "express";
import { TenantRatingController } from "./tenant-rating.controller";
import { isAuth, isLandlord } from "@/middleware/auth";
import { validateBody, validateParams } from "@/middleware/validateSchema";
import { TenantRatingSchemas } from "./tenant-rating.schema";

const tenantRatingRouter = Router();
tenantRatingRouter
  .route("/")
  .post(
    isAuth,
    isLandlord,
    validateBody(TenantRatingSchemas.createTenantRatingSchema),
    TenantRatingController.createRating
  )
  .put(
    isAuth,
    isLandlord,
    validateBody(TenantRatingSchemas.updateTenantRatingSchema),
    TenantRatingController.updateRating
  )
  .get(isAuth, isLandlord, TenantRatingController.getAllRatingsByLandlordId);

tenantRatingRouter
  .route("/:ratingId")
  .delete(
    isAuth,
    isLandlord,
    validateParams(TenantRatingSchemas.idParams("ratingId", " id")),
    TenantRatingController.deleteRating
  )
  .get(
    isAuth,
    isLandlord,
    validateParams(TenantRatingSchemas.idParams("ratingId", "id")),

    TenantRatingController.getRatingById
  );

export default tenantRatingRouter;
