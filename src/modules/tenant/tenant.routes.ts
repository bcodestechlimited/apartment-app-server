import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { TenantController } from "./tenant.controller.js";
import { isAuth } from "@/middleware/auth.js";

const router = express.Router();

router.route("/").get(TenantController.getAllTenants).all(methodNotAllowed);

router
  .route("/landlord")
  .get(isAuth, TenantController.getLandlordTenants)
  .all(methodNotAllowed);

router
  .route("/:tenantId")
  .get(TenantController.getTenantById)
  .all(methodNotAllowed);

export default router;
