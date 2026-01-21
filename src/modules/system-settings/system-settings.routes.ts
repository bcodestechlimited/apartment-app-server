import express from "express";

const router = express.Router();

import { SystemSettingsController } from "./system-settings.controller.js";
import { isAuth, isAuthAdmin } from "@/middleware/auth.js";

router
  .route("/")
  .get(SystemSettingsController.getSystemSettings)
  .patch(isAuth, isAuthAdmin, SystemSettingsController.updateSystemSettings);

export default router;
