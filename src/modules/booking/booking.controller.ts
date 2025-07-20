import type { Request, Response } from "express";
import { BookingService } from "./booking.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";

export class BookingController {
  // Create new booking
  static async createBooking(req: Request, res: Response) {
    const bookingData = req.body;
    const files = req.files;
    const { userId } = req.user as AuthenticatedUser;
    const result = await BookingService.createBooking(
      bookingData,
      //   files,
      userId
    );
    res.status(201).json(result);
  }

  // Get all bookings
  static async getAllBookings(req: Request, res: Response) {
    const query = req.query;
    const result = await BookingService.getAllBookings(query);
    res.status(200).json(result);
  }

  // Get tenant bookings
  static async getTenantBookings(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const query = req.query;
    const result = await BookingService.getTenantBookings(userId, query);
    res.status(200).json(result);
  }

  // Get landlord bookings
  static async getLandlordBookings(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const query = req.query;
    const result = await BookingService.getLandlordBookings(userId, query);
    res.status(200).json(result);
  }

  // Get a single booking by ID
  static async getBookingById(req: Request, res: Response) {
    const { bookingId } = req.params;
    const result = await BookingService.getBookingById(bookingId as string);
    res.status(200).json(result);
  }

  // Update a booking
  static async updateBooking(req: Request, res: Response) {
    const { bookingId } = req.params;
    const bookingData = req.body;
    const { userId } = req.user as AuthenticatedUser;
    const result = await BookingService.updateBooking(
      bookingId as string,
      //   bookingData,
      userId
    );
    res.status(200).json(result);
  }

  // // Delete a booking
  // static async deleteBooking(req: Request, res: Response) {
  //   const { bookingId } = req.params;
  //   const { userId } = req.user as AuthenticatedUser;
  //   const result = await BookingService.deleteBooking(
  //     bookingId as string,
  //     userId
  //   );
  //   res.status(200).json(result);
  // }


}
