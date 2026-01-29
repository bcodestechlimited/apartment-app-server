import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
import { BookingRequestService } from "./booking-request.service.js";
import { PaymentService } from "../../services/payment.service.js";
import { env } from "@/config/env.config.js";

export class BookingRequestController {
  //Booking Requests
  // Crreate Booking Request
  static async createBookingRequest(req: Request, res: Response) {
    const bookingData = req.body;
    const { userId } = req.user as AuthenticatedUser;
    const result = await BookingRequestService.createBookingRequest(
      bookingData,
      userId,
    );
    res.status(201).json(result);
  }

  // Get All Booking Requests
  static async getAllBookingRequest(req: Request, res: Response) {
    const query = req.query;
    const { userId } = req.user as AuthenticatedUser;
    const result = await BookingRequestService.getLandlordBookingRequests(
      query,
      userId,
    );
    res.status(200).json(result);
  }

  // Get Landlord Booking Requests
  static async getLandlordBookingRequest(req: Request, res: Response) {
    const query = req.query;
    const { userId } = req.user as AuthenticatedUser;
    const result = await BookingRequestService.getLandlordBookingRequests(
      query,
      userId,
    );
    res.status(200).json(result);
  }

  // Get Tenant Booking Requests
  static async getTenantBookingRequest(req: Request, res: Response) {
    const query = req.query;
    const { userId } = req.user as AuthenticatedUser;
    const result = await BookingRequestService.getTenantBookingRequests(
      query,
      userId,
    );
    res.status(200).json(result);
  }

  // Update Booking Request
  static async updateBookingRequest(req: Request, res: Response) {
    const { bookingRequestId } = req.params;
    const bookingData = req.body;
    const { userId } = req.user as AuthenticatedUser;
    const result = await BookingRequestService.updateBookingRequest(
      bookingRequestId as string,
      bookingData,
      userId,
    );
    res.status(200).json(result);
  }

  // Delete Booking Request
  static async deleteBookingRequest(req: Request, res: Response) {
    const { bookingRequestId } = req.params;
    const { userId } = req.user as AuthenticatedUser;
    const result = await BookingRequestService.deleteBookingRequest(
      bookingRequestId as string,
      userId,
    );
    res.status(200).json(result);
  }

  // Get a single booking request by ID
  static async getBookingRequestById(req: Request, res: Response) {
    const { bookingRequestId } = req.params;
    const result = await BookingRequestService.getBookingRequestById(
      bookingRequestId as string,
    );
    res.status(200).json(result);
  }

  // Generate Payment Link for Booking Request
  static async generatePaymentLink(req: Request, res: Response) {
    const { bookingRequestId } = req.params;
    const { useWallet } = req.body;
    const user = req.user as AuthenticatedUser;
    const result = await BookingRequestService.generatePaymentLink(
      bookingRequestId as string,
      // user.userId,
      useWallet,
    );
    res.status(200).json(result);
  }

  // Verify Paystack Payment
  static async verifyPayStackPayment(req: Request, res: Response) {
    const { bookingRequestId } = req.params;
    const { trxref } = req.query;
    // await PaymentService.verifyPaystackSignature(req);
    const result = await BookingRequestService.handlePaymentSuccess(
      bookingRequestId as string,
      trxref as string,
    );

    res.redirect(
      `${env.CLIENT_BASE_URL}/dashboard/bookings/requests?bookingRequestId=${result.data.bookingRequest._id}`,
    );
    // res.status(200).json(result);
  }
}
