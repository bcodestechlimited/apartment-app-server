import Booking from "./booking.model.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import type { CreateBookingDTO } from "./booking.interface.js";
import type { ObjectId } from "mongoose";
import { UploadService } from "../../services/upload.service.js";
import type { UploadedFile } from "express-fileupload";
import { PropertyService } from "../property/property.service.js";

export class BookingService {
  // Create new booking
  static async createBooking(bookingData: CreateBookingDTO, userId: ObjectId) {
    const { propertyId } = bookingData;

    const property = await PropertyService.getPropertyDocumentById(propertyId);

    

    const booking = new Booking({ ...bookingData, user: userId });
    await booking.save();
    return ApiSuccess.created("Booking created successfully", { booking });
  }

  // Get all bookings
  static async getAllBookings() {
    const bookings = await Booking.find().populate("user", "-password");
    return ApiSuccess.ok("Bookings retrieved successfully", { bookings });
  }

  // Get single booking by ID
  static async getBookingById(id: string) {
    const booking = await Booking.findById(id).populate("user", "-password");
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    return ApiSuccess.ok("Booking retrieved successfully", { booking });
  }

  // Update booking
  static async updateBooking(id: string, userId: ObjectId) {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    // // Optionally enforce ownership
    // if (booking.user.toString() !== userId.toString()) {
    //   throw ApiError.forbidden(
    //     "You do not have permission to update this booking"
    //   );
    // }

    // Object.assign(booking, updateData);
    await booking.save();

    return ApiSuccess.ok("Booking updated successfully", { booking });
  }

  // Delete booking
  static async deleteBooking(id: string, userId: ObjectId) {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    // if (booking.user.toString() !== userId.toString()) {
    //   throw ApiError.forbidden(
    //     "You do not have permission to delete this booking"
    //   );
    // }

    await booking.deleteOne();

    return ApiSuccess.ok("Booking deleted successfully");
  }
}

export const bookingService = new BookingService();
