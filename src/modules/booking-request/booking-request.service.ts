import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import type { ClientSession, Types } from "mongoose";
import { PropertyService } from "../property/property.service.js";
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
import mongoose from "mongoose";

export class BookingRequestService {
  // ----------------- Booking Requests -----------------
  // Create Booking Request
  static async createBookingRequest(
    bookingRequestData: any,
    userId: Types.ObjectId,
  ) {
    const { propertyId, moveInDate } = bookingRequestData;

    const property = await PropertyService.getPropertyDocumentById(propertyId);
    console.log("property in booking request", property);
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
        Number((platformFeePercentage / 100) * property.price),
      otherFees: property?.otherFees,
      platformFee: Number((platformFeePercentage / 100) * property.price),
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
        undefined,
        true,
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

  static async generatePaymentLink(
    bookingRequestId: string,
    useWallet: boolean,
  ) {
    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        const bookingRequest = await BookingRequest.findById(bookingRequestId)
          .populate([{ path: "tenant" }])
          .session(session);

        if (!bookingRequest) {
          throw ApiError.notFound("Booking request not found");
        }

        if (bookingRequest.status !== "approved") {
          throw ApiError.badRequest(
            "Payment link can only be generated for approved booking requests",
          );
        }

        const totalAmount = bookingRequest.netPrice;
        let amountToChargeExternally = totalAmount;
        let deduction = 0;
        const wallet = await WalletService.getWalletByUserId(
          bookingRequest.tenant._id as string,
          session,
        );
        const walletTx = await TransactionService.getTransactionByReference(
          `wallet_deduction_${bookingRequestId}`,
          session,
        );

        if (useWallet) {
          if (wallet && wallet.balance > 0) {
            deduction = Math.min(wallet.balance, totalAmount);
            // wallet.balance -= deduction;
            amountToChargeExternally = totalAmount - deduction;

            if (!walletTx) {
              await TransactionService.createTransaction(
                {
                  user: bookingRequest.tenant._id as string,
                  transactionType: "debit",
                  reference: `wallet_deduction_${bookingRequestId}`,
                  amount: deduction,
                  description: `Wallet payment for booking ${bookingRequestId}`,
                  status: "pending",
                  adminApproval: "approved",
                  approvalDate: new Date(),
                  provider: "wallet",
                },
                session,
              );
            }
          }
        }

        // If fully paid via wallet
        if (amountToChargeExternally <= 0) {
          wallet.balance -= totalAmount;
          walletTx?.amount == totalAmount;
          await walletTx?.save({ session });
          await wallet.save({ session });

          const result = await this.handlePaymentSuccess(
            bookingRequestId,
            "WALLET_PAY",
            session,
          );
          return { fullyPaid: true, result };
        }

        return { fullyPaid: false, amountToChargeExternally, bookingRequest };
      });

      // If fully paid via wallet, return success
      if (result.fullyPaid) {
        return ApiSuccess.ok("Payment successful", {
          bookingRequest: result.result?.data.bookingRequest,
        });
      }

      // Pay remainder via Paystack (outside transaction)
      const user = await UserService.findUserById(
        result?.bookingRequest?.tenant._id as string,
      );

      const paystackSession = await PaymentService.payWithPayStack({
        email: user.email,
        amount: result.amountToChargeExternally as number,
        bookingRequestId,
      });

      return ApiSuccess.ok("Payment link generated", {
        paymentURL: paystackSession.authorizationUrl,
      });
    } catch (error) {
      // Transaction automatically rolled back
      throw error;
    }
  }

  static async handlePaymentSuccess(
    bookingRequestId: string,
    transactionReference: string,
    session?: ClientSession,
  ) {
    if (transactionReference !== "WALLET_PAY") {
      const existingPaymentReference = await BookingRequest.findOne({
        paymentReference: transactionReference,
      }).session(session || null);

      if (existingPaymentReference) {
        throw ApiError.badRequest("Payment reference has already been used.");
      }
    }

    const bookingRequest = await BookingRequest.findById(bookingRequestId)
      .populate("landlord tenant property")
      .session(session || null);

    if (!bookingRequest) throw ApiError.notFound("Booking request not found");

    // 1. Calculate the split
    const walletContribution = await this.getWalletContribution(
      bookingRequestId,
      session,
    );
    const wallet = await WalletService.getWalletByUserId(
      bookingRequest.tenant._id as string,
      session,
    );
    const walletTx = await TransactionService.getTransactionByReference(
      `wallet_deduction_${bookingRequestId}`,
      session,
    );
    const expectedPaystackAmount =
      (bookingRequest.netPrice || 0) - walletContribution;

    // 2. Verification and Dynamic Method Detection
    if (transactionReference === "WALLET_PAY") {
      bookingRequest.paymentProvider = "wallet";
      bookingRequest.paymentMethod = "wallet";
    } else {
      const { data } =
        await PaymentService.verifyPayStackPayment(transactionReference);

      if (data?.status !== "success") {
        throw ApiError.badRequest("Transaction Reference Invalid");
      }

      // Verify Paystack payment matches the remainder
      if (data?.amount && data.amount / 100 < expectedPaystackAmount) {
        throw ApiError.badRequest(
          `Underpayment: Expected ${expectedPaystackAmount}, received ${data.amount / 100}`,
        );
      }

      wallet.balance -= walletContribution;

      bookingRequest.paymentProvider = "paystack";
      bookingRequest.paymentMethod = data?.channel || "card";
      await wallet.save({ session });
    }

    if (walletTx) {
      walletTx.status = "success";
      await walletTx.save({ session });
    }

    // Finalize Booking Request Status
    bookingRequest.paymentStatus = "success";
    bookingRequest.paymentReference = transactionReference;
    await bookingRequest.save({ session });

    // Credit Landlord Wallet (Total - Platform Fee)
    const landlordWallet = await WalletService.getWalletByUserId(
      bookingRequest.landlord._id as string,
      session,
    );
    const amountToCredit =
      (Number(bookingRequest.netPrice) || 0) -
      (Number(bookingRequest.platformFee) || 0);

    landlordWallet.balance += amountToCredit;
    await landlordWallet.save({ session });

    // Create Booking
    const bookingData = {
      tenant: bookingRequest.tenant._id,
      landlord: bookingRequest.landlord._id,
      property: bookingRequest.property._id,
      moveInDate: bookingRequest.moveInDate,
      moveOutDate: bookingRequest.moveOutDate,
      basePrice: bookingRequest.basePrice,
      netPrice: bookingRequest.netPrice,
      platformFee: bookingRequest.platformFee,
      otherFees: bookingRequest.otherFees,
      paymentStatus: "success",
      paymentMethod: bookingRequest.paymentMethod,
      paymentProvider: bookingRequest.paymentProvider,
      paymentReference: transactionReference,
      paymentDue: bookingRequest.moveOutDate,
    };

    const booking = session
      ? (await Booking.create([bookingData], { session }))[0]
      : await Booking.create(bookingData);

    // Log Paystack transaction if applicable
    if (transactionReference !== "WALLET_PAY") {
      await TransactionService.createTransaction(
        {
          user: bookingRequest.tenant._id as string,
          transactionType: "payment",
          amount: expectedPaystackAmount,
          adminApproval: "approved",
          approvalDate: new Date(),
          provider: "paystack",
          reference: transactionReference,
          status: "success",
        },
        session,
      );
    }

    await TransactionService.createTransaction(
      {
        user: bookingRequest.landlord._id as string,
        transactionType: "payment",
        amount: amountToCredit,
        adminApproval: "approved",
        platformFee: bookingRequest.platformFee,
        approvalDate: new Date(),
        provider: "wallet",
        reference:
          transactionReference != "WALLET_PAY"
            ? transactionReference
            : `wallet_topup_${bookingRequestId}`,
        status: "success",
      },
      session,
    );

    // Create Tenant
    await TenantService.createTenant(
      {
        user: bookingRequest.tenant._id,
        landlord: bookingRequest.landlord._id,
        property: bookingRequest.property._id,
        moveInDate: bookingRequest.moveInDate,
        moveOutDate: bookingRequest.moveOutDate,
        isActive: true,
      },
      session,
    );

    // Update Property bookedBy
    await PropertyService.addToBookedBy(
      bookingRequest.tenant._id,
      bookingRequest.property._id,
      session,
    );

    // Create or get conversation
    await MessageService.getOrCreateConversation(
      bookingRequest.tenant._id as string,
      bookingRequest.landlord._id as string,
      undefined,
      session,
    );

    // Save booking (only if not using session, since create with session already saves)
    if (!session) {
      await booking?.save();
    }

    // Update landlord stats
    await UserService.updateLandlordStats(
      booking?.landlord._id as string,
      { earningsDelta: booking?.netPrice },
      session,
    );

    // Update property revenue
    await PropertyService.updatePropertyRevenue(
      booking?.property._id as string,
      booking?.netPrice as number,
      session,
    );

    // Schedule payment success email (non-blocking, outside transaction is fine)
    await schedulePaymentSuccessEmail({
      landlordName: bookingRequest.landlord.firstName,
      landlordEmail: bookingRequest.landlord.email,
      tenantName: bookingRequest.tenant.firstName,
      tenantEmail: bookingRequest.tenant.email,
      propertyName:
        bookingRequest.property.title || bookingRequest.property.description,
      moveInDate: formatPrettyDate(bookingRequest.moveInDate),
      landlordDashboardUrl: clientURLs.landlord.dashboardURL,
      tenantDashboardUrl: clientURLs.tenant.dashboardURL,
    });

    return ApiSuccess.ok("Payment successful", { bookingRequest });
  }

  private static async getWalletContribution(
    bookingRequestId: string,
    session?: ClientSession,
  ): Promise<number> {
    try {
      const walletTx = await TransactionService.getTransactionByReference(
        `wallet_deduction_${bookingRequestId}`,
        session,
      );
      return walletTx && walletTx.status === "pending" ? walletTx.amount : 0;
    } catch {
      return 0;
    }
  }
}

export const bookingRequestService = new BookingRequestService();
