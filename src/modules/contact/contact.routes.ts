import { Router } from "express";
import { ContactController } from "./contact.controller";
import limiter from "@/middleware/rateLimiter";
import { ContactSchema } from "./contact.schema";
import { validateBody } from "@/middleware/validateSchema";

const router = Router();

router
  .route("/")
  .post(
    limiter,
    validateBody(ContactSchema.createContact),
    ContactController.sendContactUsMail,
  );

export default router;
