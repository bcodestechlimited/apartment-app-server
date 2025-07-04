import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { isAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { BookingController } from "./booking.controller.js";
import { BookingSchemas } from "./booking.schema.js";

const router = express.Router();

router
  .route("/")
  .get(BookingController.getAllBookings) // public or protected as needed
  .post(
    isAuth,
    validateBody(BookingSchemas.create), // Assuming you have a create schema in BookingSchemas
    // validateBody(PropertySchemas.create),
    BookingController.createBooking
  )
  .all(methodNotAllowed);

router
  .route("/:id")
  .get(BookingController.getBookingById) // public or protected as needed
  //   .patch(
  //     isAuth,
  //     validateBody(),
  //     BookingController.updateBooking
  //   )
  //   .delete(isAuth, BookingController.deleteBooking) // protected
  .all(methodNotAllowed);

export default router;
