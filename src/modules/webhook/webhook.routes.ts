import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { WebhookController } from "./webhook.controller.js";

const router = express.Router();

router
  .route("/paystack")
  .post(WebhookController.handlePaystackWebhook)
  .all(methodNotAllowed);

export default router;
