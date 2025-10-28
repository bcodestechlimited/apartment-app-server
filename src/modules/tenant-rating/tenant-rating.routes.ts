import { isAuth, isTenant } from "@/middleware/auth";
import { validateBody, validateParams } from "@/middleware/validateSchema";
import { Router } from "express";
import { TenantRatingSchema } from "./tenant-rating.schema";
import { TenantRatingController } from "./tenant-rating.controller";

const tenantRatingRouter = Router();

tenantRatingRouter
  .route("/")
  //   .get(isAuth, isTenant)
  .post(
    isAuth,
    isTenant,
    validateBody(TenantRatingSchema.createTenantRatingSchema),
    TenantRatingController.createRating
  )
  .put(
    isAuth,
    isTenant,
    validateBody(TenantRatingSchema.updateTenantRatingSchema),

    TenantRatingController.updateRating
  );

tenantRatingRouter
  .route("/:ratingId")
  .get(
    isAuth,
    isTenant,
    validateParams(TenantRatingSchema.idParams("ratingId", "id")),
    TenantRatingController.getRatingById
  )

  .delete(
    isAuth,
    isTenant,
    validateBody(TenantRatingSchema.idParams("ratingId", "id")),
    TenantRatingController.deleteRating
  );

export default tenantRatingRouter;
