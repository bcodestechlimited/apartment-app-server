import Booking from "./booking.model.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import type { CreateBookingDTO } from "./booking.interface.js";
import type { ObjectId } from "mongoose";
import { PropertyService } from "../property/property.service.js";
import { PaymentService } from "../../services/payment.service.js";
import { calculateBookingPeriod } from "../../utils/calculationUtils.js";
import { paginate } from "../../utils/paginate.js";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
import BookingRequest from "../booking-request/booking-request.model.js";

export class BookingService {
  // Create new booking
  static async createBooking(bookingData: CreateBookingDTO, userId: ObjectId) {
    const { propertyId } = bookingData;

    const property = await PropertyService.getPropertyDocumentById(propertyId);

    if (!property.isAvailable) {
      throw ApiError.forbidden("Property is not available");
    }

    let startDate;
    let endDate;

    // switch (property.pricingModel.toLowerCase()) {
    //   case "hourly":
    //     startDate = new Date();
    //     endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
    //     break;
    //   case "daily":
    //     startDate = new Date();
    //     endDate = new Date(
    //       startDate.getTime() + duration * 24 * 60 * 60 * 1000
    //     );
    //     break;
    //   case "weekly":
    //     startDate = new Date();
    //     endDate = new Date(
    //       startDate.getTime() + duration * 7 * 24 * 60 * 60 * 1000
    //     );
    //     break;
    //   case "monthly":
    //     startDate = new Date();
    //     endDate = new Date(
    //       startDate.getFullYear(),
    //       startDate.getMonth() + duration,
    //       startDate.getDate()
    //     );
    //     break;
    //   case "yearly":
    //     startDate = new Date();
    //     endDate = new Date(
    //       startDate.getFullYear() + duration,
    //       startDate.getMonth(),
    //       startDate.getDate()
    //     );
    //     break;
    //   default:
    //     throw ApiError.badRequest("Invalid pricing model");
    // }

    const booking = new Booking({
      ...bookingData,
      landlord: property.user,
      tenant: userId,
      property: propertyId,
      startDate,
      endDate,
    });
    await booking.save();
    return ApiSuccess.created("Booking created successfully", { booking });
  }

  // Get all bookings
  static async getAllBookings(query: IQueryParams) {
    const { page, limit } = query;
    const filterQuery = {};
    const sort = { createdAt: -1 };
    const populateOptions = [
      { path: "tenant" },
      { path: "landlord" },
      { path: "property" },
    ];

    const { documents: bookings, pagination } = await paginate({
      model: Booking,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.ok("Bookings retrieved successfully", {
      bookings,
      pagination,
    });
  }

  // Get tenant bookings
  static async getTenantBookings(userId: ObjectId, query: IQueryParams) {
    const { page, limit } = query;
    const filterQuery = { tenant: userId };
    const sort = { createdAt: -1 };
    const populateOptions = [
      { path: "tenant" },
      { path: "landlord" },
      { path: "property" },
    ];

    const { documents: bookings, pagination } = await paginate({
      model: Booking,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.ok("Bookings retrieved successfully", {
      bookings,
      pagination,
    });
  }

  // Get landlord bookings
  static async getLandlordBookings(userId: ObjectId, query: IQueryParams) {
    const { page, limit } = query;
    const filterQuery = { landlord: userId };
    const sort = { createdAt: -1 };
    const populateOptions = [
      { path: "tenant" },
      { path: "landlord" },
      { path: "property" },
    ];

    const { documents: bookings, pagination } = await paginate({
      model: Booking,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.ok("Bookings retrieved successfully", {
      bookings,
      pagination,
    });
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
  // static async deleteBooking(id: string, userId: ObjectId) {
  //   const booking = await Booking.findById(id);
  //   if (!booking) {
  //     throw ApiError.notFound("Booking not found");
  //   }

  //   // if (booking.user.toString() !== userId.toString()) {
  //   //   throw ApiError.forbidden(
  //   //     "You do not have permission to delete this booking"
  //   //   );
  //   // }

  //   await booking.deleteOne();

  //   return ApiSuccess.ok("Booking deleted successfully");
  // }

  // static async generatePaymentLink(bookingRequestId: string) {
  //   const bookingRequest = await BookingRequest.findById(bookingRequestId);
  //   if (!bookingRequest) {
  //     throw ApiError.notFound("Booking request not found");
  //   }

  //   if (bookingRequest.status !== "pending") {
  //     throw ApiError.badRequest(
  //       "Payment link can only be generated for pending booking requests"
  //     );
  //   }

  //   return ApiSuccess.ok("Payment link generated successfully", {});
  // }

  // static async handlePaymentSuccess(
  //   bookingRequestId: string,
  //   transactionReference: string
  // ) {
  //   const existingPaymentReference = await BookingRequest.findOne({
  //     paymentReference: transactionReference,
  //   });

  //   if (existingPaymentReference) {
  //     throw ApiError.badRequest("Payment reference has already been used.");
  //   }

  //   const bookingRequest = await BookingRequest.findById(bookingRequestId);

  //   if (!bookingRequest) throw ApiError.notFound("Booking request not found");

  //   const { data } = await PaymentService.verifyPayStackPayment(
  //     transactionReference
  //   );

  //   if (data?.status !== "success") {
  //     throw ApiError.badRequest("Transasction Reference Invalid");
  //   }

  //   if (data?.amount && data?.amount / 100 !== bookingRequest.totalPrice) {
  //     throw ApiError.badRequest("Reference amount Mismatch");
  //   }

  //   bookingRequest.paymentStatus = "success";
  //   bookingRequest.paymentReference = transactionReference;
  //   await bookingRequest.save();

  //   // Create the actual booking
  //   // const booking = new Booking({
  //   //   tenant: bookingRequest.tenant,
  //   //   landlord: bookingRequest.landlord,
  //   //   property: bookingRequest.property,
  //   //   moveInDate: bookingRequest.moveInDate,
  //   //   startDate: bookingRequest.startDate,
  //   //   endDate: bookingRequest.endDate,
  //   //   totalPrice: bookingRequest.totalPrice,
  //   //   netPrice: bookingRequest.netPrice,
  //   //   serviceChargeAmount: bookingRequest.serviceChargeAmount,
  //   //   paymentMethod: bookingRequest.paymentMethod,
  //   //   paymentProvider: bookingRequest.paymentProvider,
  //   //   paymentReference: transactionReference,
  //   // });

  //   // await booking.save();

  //   // Notify tenant about successful payment
  //   agenda.now("send_payment_success_email_to_tenant", {
  //     tenantEmail: bookingRequest.tenant.email,
  //     tenantName: bookingRequest.tenant.firstName,
  //     propertyName: bookingRequest.property.description, // Change to title later
  //   });

  //   // Notify landlord about successful payment
  //   agenda.now("send_payment_success_email_to_landlord", {
  //     landlordEmail: bookingRequest.landlord.email,
  //     landlordName: bookingRequest.landlord.firstName,
  //     propertyName: bookingRequest.property.description, // Change to title later
  //   });

  //   return ApiSuccess.ok("Payment successful", { bookingRequest });
  // }
}

export const bookingService = new BookingService();
