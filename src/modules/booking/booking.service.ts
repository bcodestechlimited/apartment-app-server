import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import type {
  CreateBookingDTO,
  UpdateBookingDTO,
} from "./booking.interface.js";
import type { ObjectId, Types } from "mongoose";
import { PropertyService } from "../property/property.service.js";
import { PaymentService } from "../../services/payment.service.js";
// import { calculateBookingPeriod } from "../../utils/calculationUtils.js";
import { paginate } from "../../utils/paginate.js";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
// import BookingRequest from "../booking-request/booking-request.model.js";
// import { MessageService } from "../message/message.service.js";
import UserService from "../user/user.service.js";
import mongoose from "mongoose";
import { Booking, BookingDay } from "./booking.model.js";
import { SystemSettingService } from "../system-settings/system-settings.service.js";
import { TransactionService } from "../transaction/transaction.service.js";
import { TransactionRepository } from "../transaction/transaction.repository.js";
import { WalletService } from "../wallet/wallet.service.js";
import { MessageService } from "../message/message.service.js";
import { clientURLs } from "@/utils/clientURL.js";
import { schedulePaymentSuccessEmail } from "@/jobs/sendPaymentSuccess.js";

export class BookingService {
  // Get booked days
  static async getBookedDays(params: IQueryParams) {
    const { startDate, endDate, bookingId, propertyId } = params;

    const query: any = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (bookingId) {
      query.booking = bookingId;
    }

    if (propertyId) {
      query.property = propertyId;
    }

    const bookedDays = await BookingDay.find(query);

    return ApiSuccess.ok("Booked days retrieved successfully", { bookedDays });
  }

  // Create new booking
  static async createBooking(
    bookingData: CreateBookingDTO,
    userId: ObjectId | Types.ObjectId | string,
  ) {
    const { propertyId, days } = bookingData;

    const property = await PropertyService.getPropertyDocumentById(propertyId);
    const user = await UserService.findUserById(userId as string);
    const platformFeePercentage = await SystemSettingService.getPlatformFee();

    if (!property.isAvailable) {
      throw ApiError.forbidden("Property is not available");
    }

    const basePrice = property?.price * days.length;
    const platformFee = (basePrice * platformFeePercentage) / 100;
    const paymentAmount = basePrice + platformFee;
    const netPrice = paymentAmount;

    // Create Transaction
    const transaction = await TransactionService.createTransaction({
      user: userId as string,
      transactionType: "payment",
      amount: paymentAmount,
      provider: "paystack",
      status: "pending",
      currency: "NGN",
      method: null,
    });

    if (!transaction) {
      throw ApiError.internalServerError("Something went wrong");
    }

    const booking = new Booking({
      ...bookingData,
      landlord: property.user,
      tenant: userId,
      property: propertyId,
      days,
      basePrice,
      netPrice,
      paymentAmount,
      platformFee,
      transaction: transaction._id,
    });

    await booking.save();

    // Payment
    const paystackSession = await PaymentService.payWithPayStack({
      email: user.email,
      amount: paymentAmount,
      bookingId: booking?._id as string,
    });

    // await UserService.syncUserPaymentStatus(userId);

    return ApiSuccess.created("Booking created successfully", {
      booking,
      session: paystackSession,
    });
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
  static async updateBooking(
    bookingId: string,
    payload: UpdateBookingDTO,
    userId: string | Types.ObjectId,
  ) {
    const booking = await Booking.findOneAndUpdate({ _id: bookingId }, payload);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    await booking.save();

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

  static async handlePaymentSuccess(
    bookingId: string,
    transactionReference: string,
  ) {
    console.log(
      `Webhook received: bookingId=${bookingId}, transactionReference=${transactionReference}`,
    );

    const existingPaymentReference = await Booking.findOne({
      paymentReference: transactionReference,
    });

    if (existingPaymentReference) {
      throw ApiError.badRequest("Payment reference has already been used.");
    }

    const { data } =
      await PaymentService.verifyPayStackPayment(transactionReference);

    console.log({ transactionReferenceData: data });

    if (data?.status !== "success") {
      throw ApiError.badRequest("Transaction Reference Invalid");
    }

    const booking = await Booking.findById(bookingId).populate(
      "landlord tenant property transaction",
    );

    if (!booking) throw ApiError.notFound("Booking not found");

    booking.status = "confirmed";

    await booking.save();

    console.log({ booking });

    const transaction = await TransactionRepository.findOne({
      _id: booking?.transaction?._id as string,
    });

    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }

    await TransactionRepository.update(
      { _id: booking?.transaction?._id },
      {
        status: "success",
      },
    );

    // Credit Landlord Wallet
    const landlordCut = transaction?.amount - booking?.platformFee;

    // Create days for the booking (For blocking out calendar)
    const bookingDays = booking?.days?.map((day) => ({
      booking: booking._id,
      property: booking.property._id,
      date: new Date(day),
    }));

    await BookingDay.insertMany(bookingDays);

    // // Create or get conversation
    await MessageService.getOrCreateConversation(
      booking.tenant._id as string,
      booking.landlord._id as string,
      undefined,
    );

    // Update property revenue
    await PropertyService.updatePropertyRevenue(
      booking?.property._id as string,
      booking?.netPrice as number,
    );

    await WalletService.fundUserWallet(
      booking?.landlord?._id as string,
      landlordCut,
    );

    await schedulePaymentSuccessEmail({
      landlordName: booking.landlord.firstName,
      landlordEmail: booking.landlord.email,
      tenantName: booking.tenant.firstName,
      tenantEmail: booking.tenant.email,
      propertyName: booking.property.title || booking.property.description,
      landlordDashboardUrl: clientURLs.landlord.dashboardURL,
      tenantDashboardUrl: clientURLs.tenant.dashboardURL,
    });

    return ApiSuccess.ok("Payment successful", { booking });
  }
}

export const bookingService = new BookingService();
