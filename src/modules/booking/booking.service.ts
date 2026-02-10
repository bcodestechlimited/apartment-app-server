import Booking from "./booking.model.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import type { CreateBookingDTO } from "./booking.interface.js";
import type { ObjectId, Types } from "mongoose";
import { PropertyService } from "../property/property.service.js";
import { PaymentService } from "../../services/payment.service.js";
import { calculateBookingPeriod } from "../../utils/calculationUtils.js";
import { paginate } from "../../utils/paginate.js";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
import BookingRequest from "../booking-request/booking-request.model.js";
import { MessageService } from "../message/message.service.js";
import UserService from "../user/user.service.js";
import mongoose from "mongoose";

export class BookingService {
  // Create new booking
  static async createBooking(
    bookingData: CreateBookingDTO,
    userId: ObjectId | Types.ObjectId,
  ) {
    const { propertyId } = bookingData;

    const property = await PropertyService.getPropertyDocumentById(propertyId);

    if (!property.isAvailable) {
      throw ApiError.forbidden("Property is not available");
    }

    let startDate;
    let endDate;

    const booking = new Booking({
      ...bookingData,
      landlord: property.user,
      tenant: userId,
      property: propertyId,
      startDate,
      endDate,
    });
    await booking.save();

    await UserService.syncUserPaymentStatus(userId);

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
  static async getTenantBookings(
    userId: ObjectId | string | Types.ObjectId,
    query: IQueryParams,
  ) {
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
  static async getLandlordBookings(
    userId: ObjectId | string | Types.ObjectId,
    query: IQueryParams,
  ) {
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

  static async getBookingByIdAndPaymentStatus(id: string) {
    return await Booking.find({
      tenant: id,
      paymentStatus: { $in: ["pending", "failed"] },
    });
  }

  // Update booking
  static async updateBooking(id: string, userId: ObjectId | Types.ObjectId) {
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

    await UserService.syncUserPaymentStatus(booking.tenant._id);

    return ApiSuccess.ok("Booking updated successfully", { booking });
  }

  static async getLandlordStats(landlordId: string | Types.ObjectId) {
    const landlordObjectId = new mongoose.Types.ObjectId(landlordId as string);

    const stats = await mongoose.model("Booking").aggregate([
      { $match: { landlord: landlordObjectId } },
      {
        $group: {
          _id: "$landlord",
          totalEarnings: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "success"] }, "$netPrice", 0],
            },
          },
          pendingPayouts: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$netPrice", 0],
            },
          },
          lastPayoutDate: {
            $max: {
              $cond: [
                { $eq: ["$paymentStatus", "success"] },
                "$updatedAt",
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalEarnings: 1,
          pendingPayouts: 1,
          lastPayoutDate: 1,
          // Assuming lastPayoutAmount is the netPrice of the most recent successful booking
          lastPayoutAmount: { $literal: 0 },
        },
      },
    ]);

    const result = stats[0] || {
      totalEarnings: 0,
      pendingPayouts: 0,
      lastPayoutAmount: 0,
      lastPayoutDate: null,
    };

    return ApiSuccess.ok("Landlord stats retrieved successfully", result);
  }

  static async getTenantStats(tenantId: string | Types.ObjectId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId as string);

    const stats = await mongoose.model("Booking").aggregate([
      { $match: { tenant: tenantObjectId } },
      {
        $group: {
          _id: "$tenant",
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "success"] }, "$netPrice", 0],
            },
          },
          outstandingBalance: {
            $sum: {
              $cond: [
                { $in: ["$paymentStatus", ["pending", "failed"]] },
                "$netPrice",
                0,
              ],
            },
          },
          refundsProcessed: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, "$netPrice", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaid: 1,
          outstandingBalance: 1,
          refundsProcessed: 1,
        },
      },
    ]);

    const result = stats[0] || {
      totalPaid: 0,
      outstandingBalance: 0,
      refundsProcessed: 0,
    };

    return ApiSuccess.ok("Tenant stats retrieved successfully", result);
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
