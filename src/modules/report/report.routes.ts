import express from "express";
import Report from "./report.model";
import { ReportController } from "./report.controller";
import methodNotAllowed from "@/middleware/methodNotAllowed";
import { isAuth } from "@/middleware/auth";

const router = express.Router();

router
  .route("/")
  .post(isAuth, ReportController.createReport)
  .all(methodNotAllowed);

export default router;
