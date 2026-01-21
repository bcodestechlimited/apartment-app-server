import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import type { ObjectId, Types } from "mongoose";
import {
  propertyService,
  PropertyService,
} from "../property/property.service.js";
import { PaymentService } from "../../services/payment.service.js";
import { calculateBookingPeriod } from "../../utils/calculationUtils.js";
import { paginate } from "../../utils/paginate.js";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
import BookingRequest from "./booking-request.model.js";
import { scheduleBookingRequest } from "../../jobs/sendBookingRequest.js";
import { scheduleBookingRequestDeclined } from "../../jobs/sendBookingRequestDeclined.js";
import { env } from "../../config/env.config.js";
import { schedulePaymentSuccessEmail } from "@/jobs/sendPaymentSuccess.js";
import { clientURLs } from "@/utils/clientURL.js";
import Booking from "../booking/booking.model.js";
import { TenantService } from "../tenant/tenant.service.js";
import { formatDate, formatPrettyDate } from "@/utils/formatUtils.js";
import { scheduleBookingRequestApprovalEmailToTenant } from "@/jobs/sendBookingRequestApproved.js";
import { MessageService } from "../message/message.service.js";
import { TransactionService } from "../transaction/transaction.service.js";
import { WalletService } from "../wallet/wallet.service.js";
import UserService from "../user/user.service.js";
import { SystemSettingService } from "../system-settings/system-settings.service.js";

export class BookingRequestService {
  // ----------------- Booking Requests -----------------
  // Create Booking Request
  static async createBookingRequest(
    bookingRequestData: any,
    userId: Types.ObjectId,
  ) {
    const { propertyId, moveInDate } = bookingRequestData;

    const property = await PropertyService.getPropertyDocumentById(propertyId);
    const landlordId = property.user;

    const { startDate, endDate } = calculateBookingPeriod(
      moveInDate,
      property.pricingModel,
    );

    if (property.isDeleted) {
      throw ApiError.forbidden("Property has been deleted");
    }

    // if (new Date(property.availabilityDate) <= new Date()) {
    //   throw ApiError.forbidden("Property is still booked at the moment");
    // }

    const platformFeePercentage = await SystemSettingService.getPlatformFee();

    const bookingRequest = await BookingRequest.create({
      tenant: userId,
      property: propertyId,
      landlord: landlordId,
      basePrice: property.price,
      netPrice:
        Number(property?.totalFees) +
        Number((platformFeePercentage / 100) * property.price), // platform fees being handled on the frontend by calling  system settings endpint
      otherFees: property?.otherFees,
      serviceChargeAmount: Number(
        (platformFeePercentage / 100) * property.price,
      ),
      moveInDate: startDate,
      moveOutDate: endDate,
      status: "pending",
    });

    await bookingRequest.populate([
      { path: "tenant", select: "firstName email" },
      { path: "landlord", select: "firstName email" },
    ]);

    property.requestedBy.push(userId);
    await property.save();

    // Set reminder to notify landlord about the booking request
    await scheduleBookingRequest({
      landlordName: bookingRequest.landlord.firstName,
      landlordEmail: bookingRequest.landlord.email,
      tenantName: bookingRequest.tenant.firstName,
      tenantEmail: bookingRequest.tenant.email,
      propertyTitle: property.title,
      moveInDate,
      landlordDashboardUrl: `${env.CLIENT_BASE_URL}/dashboard/landlord/bookings/requests`,
      tenantDashboardUrl: `${env.CLIENT_BASE_URL}/dashboard/tenant/bookings/requests`,
      bookingRequestId: String(bookingRequest._id),
      propertyId: String(propertyId),
      tenantUserId: String(userId),
    });

    return ApiSuccess.ok("Booking request created successfully", {
      bookingRequest,
    });
  }

  static async getLandlordBookingRequests(
    params: IQueryParams,
    userId: Types.ObjectId,
  ) {
    const { page = 1, limit = 10 } = params;

    const queryFilter = { landlord: userId };

    const populateOptions = [
      {
        path: "property",
        populate: {
          path: "user",
          select: "firstName email",
        },
      },
      {
        path: "tenant",
        select: "firstName email",
      },
      {
        path: "landlord",
        select: "firstName email",
      },
    ];

    const { documents: bookingRequests, pagination } = await paginate({
      model: BookingRequest,
      query: queryFilter,
      page,
      limit,
      sort: { createdAt: -1 },
      populateOptions,
    });

    return ApiSuccess.ok("Booking requests retrieved successfully", {
      bookingRequests,
      pagination,
    });
  }

  static async getTenantBookingRequests(
    params: IQueryParams,
    userId: Types.ObjectId,
  ) {
    const { page = 1, limit = 10 } = params;

    const queryFilter = { tenant: userId };

    const populateOptions = [
      {
        path: "property",
        populate: {
          path: "user",
          select: "firstName email",
        },
      },
      {
        path: "tenant",
        select: "firstName email",
      },
      {
        path: "landlord",
        select: "firstName email",
      },
    ];

    const { documents: bookingRequests, pagination } = await paginate({
      model: BookingRequest,
      query: queryFilter,
      page,
      limit,
      sort: { createdAt: -1 },
      populateOptions,
    });

    return ApiSuccess.ok("Booking requests retrieved successfully", {
      bookingRequests,
      pagination,
    });
  }

  static async updateBookingRequest(
    bookingRequestId: string,
    bookingRequestData: any,
    userId: Types.ObjectId,
  ) {
    const { status } = bookingRequestData;
    const bookingRequest = await BookingRequest.findById(
      bookingRequestId,
    ).populate("landlord tenant property");

    if (!bookingRequest) {
      throw ApiError.notFound("Booking request not found");
    }

    // Optionally enforce ownership
    if (String(bookingRequest.landlord._id) !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to update this booking request",
      );
    }

    if (status === "approved") {
      bookingRequest.status = "approved";
      bookingRequest.paymentDue = new Date(Date.now() + 24 * 60 * 60 * 1000); // Payment due in 24 hours

      await PropertyService.updateProperty(
        String(bookingRequest.property._id),
        { isAvailable: false, requestedBy: [] },
        String(bookingRequest.landlord._id),
      );

      await scheduleBookingRequestApprovalEmailToTenant({
        landlordName: bookingRequest.landlord.firstName,
        landlordEmail: bookingRequest.landlord.email,
        tenantName: bookingRequest.tenant.firstName,
        tenantEmail: bookingRequest.tenant.email,
        propertyTitle: bookingRequest.property.title,
        moveInDate: formatDate(bookingRequest.moveInDate),
        tenantDashboardUrl: clientURLs.tenant.dashboardURL,
        landlordDashboardUrl: clientURLs.landlord.dashboardURL,
        bookingRequestId: bookingRequest._id.toString(),
        propertyId: bookingRequest.property._id as string,
        tenantUserId: bookingRequest.tenant._id as string,
      });

      // Get all pending booking requests for the same property
      const declinedRequests = await BookingRequest.find({
        property: bookingRequest.property._id,
        _id: { $ne: bookingRequest._id }, // Exclude the accepted request
        status: "pending",
      }).populate("tenant");

      if (declinedRequests.length !== 0) {
        for (const request of declinedRequests) {
          await scheduleBookingRequestDeclined({
            tenantEmail: request.tenant.email,
            tenantName: request.tenant.firstName,
            propertyTitle: bookingRequest.property.title,
          });
        }

        // Mark other booking requests for the same property as declined
        await BookingRequest.updateMany(
          {
            property: bookingRequest.property._id,
            _id: { $ne: bookingRequest._id },
          },
          { status: "declined" },
        );
      }
    }

    // Handle Decline
    if (status === "declined") {
      bookingRequest.status = "declined";
      // Notify tenant about the declined request

      await PropertyService.pullTenantFromPropertyRequestedById(
        String(bookingRequest.property._id),
        String(bookingRequest.tenant._id),
      );

      await scheduleBookingRequestDeclined({
        tenantEmail: bookingRequest.tenant.email,
        tenantName: bookingRequest.tenant.firstName,
        propertyTitle: bookingRequest.property.title,
      });
    }

    bookingRequest.status = status;
    await bookingRequest.save();

    return ApiSuccess.ok("Booking request updated successfully", {
      bookingRequest,
    });
  }

  static async getBookingRequestById(bookingRequestId: string) {
    const bookingRequest = await BookingRequest.findById(
      bookingRequestId,
    ).populate([
      {
        path: "property",
        populate: {
          path: "user",
          select: "firstName email",
        },
      },
      {
        path: "tenant",
        select: "firstName email",
      },
      {
        path: "landlord",
        select: "firstName email",
      },
    ]);

    if (!bookingRequest) {
      throw ApiError.notFound("Booking request not found");
    }

    return ApiSuccess.ok("Booking request retrieved successfully", {
      bookingRequest,
    });
  }

  static async deleteBookingRequest(
    bookingRequestId: string,
    userId: Types.ObjectId,
  ) {
    const bookingRequest = await BookingRequest.findById(bookingRequestId);
    if (!bookingRequest) {
      throw ApiError.notFound("Booking request not found");
    }

    // Optionally enforce ownership
    if (bookingRequest.landlord.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to delete this booking request",
      );
    }

    await bookingRequest.deleteOne();

    return ApiSuccess.ok("Booking request deleted successfully");
  }

  static async generatePaymentLink(bookingRequestId: string) {
    const bookingRequest = await BookingRequest.findById(
      bookingRequestId,
    ).populate([
      {
        path: "tenant",
      },
    ]);

    if (!bookingRequest) {
      throw ApiError.notFound("Booking request not found");
    }

    if (bookingRequest.status !== "approved") {
      throw ApiError.badRequest(
        "Payment link can only be generated for approved booking requests",
      );
    }

    const response = await PaymentService.payWithPayStack({
      amount: bookingRequest.netPrice,
      email: bookingRequest.tenant.email,
      bookingRequestId: bookingRequest._id.toString(),
    });

    return ApiSuccess.ok("Payment link generated successfully", {
      paymentURL: response.authorizationUrl,
    });
  }

  static async handlePaymentSuccess(
    bookingRequestId: string,
    transactionReference: string,
  ) {
    const existingPaymentReference = await BookingRequest.findOne({
      paymentReference: transactionReference,
    });

    if (existingPaymentReference) {
      throw ApiError.badRequest("Payment reference has already been used.");
    }

    const bookingRequest = await BookingRequest.findById(bookingRequestId);

    if (!bookingRequest) throw ApiError.notFound("Booking request not found");

    const { data } =
      await PaymentService.verifyPayStackPayment(transactionReference);

    if (data?.status !== "success") {
      throw ApiError.badRequest("Transasction Reference Invalid");
    }

    if (data?.amount && data?.amount / 100 !== bookingRequest.netPrice) {
      throw ApiError.badRequest("Reference amount Mismatch");
    }

    bookingRequest.paymentStatus = "success";
    bookingRequest.paymentReference = transactionReference;
    await bookingRequest.save();

    const landlordWallet = await WalletService.getWalletByUserId(
      bookingRequest.landlord._id as string,
    );

    console.log("landlordWallet", landlordWallet);
    console.log("bookingRequest", bookingRequest);
    const transactionAmount = Number(bookingRequest.netPrice) || 0;
    const serviceFee = Number(bookingRequest.serviceChargeAmount) || 0;
    const amountToCredit = transactionAmount - serviceFee;
    landlordWallet.balance += amountToCredit;
    await landlordWallet.save();
    // Create the actual booking
    const booking = new Booking({
      tenant: bookingRequest.tenant,
      landlord: bookingRequest.landlord,
      property: bookingRequest.property,
      moveInDate: bookingRequest.moveInDate,
      moveOutDate: bookingRequest.moveOutDate,
      basePrice: bookingRequest.basePrice,
      netPrice: bookingRequest.netPrice,
      serviceChargeAmount: bookingRequest.serviceChargeAmount,
      paymentStatus: "success",
      paymentMethod: bookingRequest.paymentMethod,
      paymentProvider: bookingRequest.paymentProvider,
      paymentReference: transactionReference,
      paymentDue: bookingRequest.moveOutDate, // set it to a day before and send reminder base on pricing model
    });

    // Create Tenant
    await TenantService.createTenant({
      user: bookingRequest.tenant._id,
      landlord: bookingRequest.landlord._id,
      property: bookingRequest.property._id,
      moveInDate: bookingRequest.moveInDate,
      moveOutDate: bookingRequest.moveOutDate,
      isActive: true,
    });

    await PropertyService.addToBookedBy(
      bookingRequest.tenant._id,
      bookingRequest.property._id,
    );

    //Create Transaction
    await TransactionService.createTransaction({
      user: bookingRequest.tenant._id,
      transactionType: "payment",
      amount: bookingRequest.netPrice,
      adminApproval: "approved",
      approvalDate: new Date(),
      provider: "paystack",
      reference: transactionReference,
      status: "success",
    });

    // Create Chat between tenant and landlord
    await MessageService.getOrCreateConversation(
      bookingRequest.tenant._id as string,
      bookingRequest.landlord._id as string,
    );

    await booking.save();

    await UserService.updateLandlordStats(booking.landlord._id as string, {
      earningsDelta: booking.netPrice,
    });

    await PropertyService.updatePropertyRevenue(
      booking.property._id,
      booking.netPrice,
    );

    await schedulePaymentSuccessEmail({
      landlordName: bookingRequest.landlord.firstName,
      landlordEmail: bookingRequest.landlord.email,
      tenantName: bookingRequest.tenant.firstName,
      tenantEmail: bookingRequest.tenant.email,
      propertyName: bookingRequest.property.description,
      moveInDate: formatPrettyDate(bookingRequest.moveInDate),
      landlordDashboardUrl: clientURLs.landlord.dashboardURL,
      tenantDashboardUrl: clientURLs.tenant.dashboardURL,
    });

    return ApiSuccess.ok("Payment successful", { bookingRequest });
  }
}

export const bookingRequestService = new BookingRequestService();
