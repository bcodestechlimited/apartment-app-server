import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { isAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { BookingRequestController } from "./booking-request.controller.js";
import { BookingRequestSchemas } from "./booking-request.schemas.js";

const router = express.Router();

router
  .route("/")
  .get(isAuth, BookingRequestController.getAllBookingRequest)
  .post(
    isAuth,
    validateBody(BookingRequestSchemas.createBookingRequest),
    BookingRequestController.createBookingRequest
  )
  .all(methodNotAllowed);

router
  .route("/landlord")
  .get(isAuth, BookingRequestController.getLandlordBookingRequest)
  .all(methodNotAllowed);

router
  .route("/tenant")
  .get(isAuth, BookingRequestController.getTenantBookingRequest)
  .all(methodNotAllowed);

router
  .route("/:bookingRequestId")
  .get(isAuth, BookingRequestController.getBookingRequestById)
  .patch(
    isAuth,
    validateBody(BookingRequestSchemas.updateBookingRequest),
    BookingRequestController.updateBookingRequest
  )
  .all(methodNotAllowed);

router
  .route("/:bookingRequestId/pay")
  .get(isAuth, BookingRequestController.generatePaymentLink)
  .all(methodNotAllowed);

// Verify payment for booking request
router
  .route("/:bookingRequestId/verify")
  .get(BookingRequestController.verifyPayStackPayment)
  .all(methodNotAllowed);

export default router;
