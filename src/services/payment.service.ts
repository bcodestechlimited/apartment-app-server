import type { Request } from "express";
import paystackClient from "../lib/paystackClient";
import logger from "../utils/logger";
import { ApiError } from "../utils/responseHandler";
import { AxiosError } from "axios";
import crypto from "crypto";
import { env } from "../config/env.config";

export class PaymentService {
  static async verifyPaystackSignature(req: Request): Promise<void> {
    const paystackSignature = req.headers["x-paystack-signature"];

    if (!paystackSignature) {
      throw ApiError.badRequest("Signature missing");
    }

    // Verify Paystack signature (Ensure you have PAYSTACK_SECRET_KEY in your env)
    // const crypto = await import("crypto");
    const hash = crypto
      .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== paystackSignature) {
      throw ApiError.unauthorized("Invalid signature");
    }
  }

  static async payWithPayStack({
    email,
    amount,
    bookingRequestId,
  }: {
    email: string;
    amount: number;
    bookingRequestId: string;
  }): Promise<{ authorizationUrl: string }> {
    try {
      const response = await paystackClient.post("/transaction/initialize", {
        email,
        amount: amount * 100,
        callback_url: `${env.SERVER_BASE_URL}/api/v1/booking-request/${bookingRequestId}/verify`,
      });

      return {
        authorizationUrl: response.data.data.authorization_url,
      };
    } catch (error: any) {
      logger.error(error?.response?.data);
      if (error instanceof AxiosError) {
        // Handle Axios specific errors
        if (error.response?.status === 400) {
          throw ApiError.badRequest("Invalid request parameters");
        }
        if (error.response?.status === 401) {
          throw ApiError.unauthorized("Unauthorized access");
        }
      }

      if (error?.response?.data) {
        throw ApiError.serviceUnavailable("Payment Gateway Unavailable");
      }

      throw ApiError.internalServerError("Something went wrong");
    }
  }

  static async verifyPayStackPayment(reference: string): Promise<{
    message: string;
    data: Partial<{ status: string; amount: number }>;
  }> {
    try {
      const response = await paystackClient.get(
        `/transaction/verify/${reference}`
      );

      if (response.data.data.status === "success") {
        // Handle successful payment here
        return {
          message: "Payment successful",
          data: response.data.data,
        };
      } else {
        return { message: "Payment failed", data: { status: "failed" } };
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle Axios specific errors
        const { message } = error?.response?.data;
        if (message) {
          throw ApiError.badRequest(message);
        }
        throw ApiError.badRequest(
          "Verification Failed" + error?.response?.data
        );
      }
      throw ApiError.internalServerError("Something went wrong");
    }
  }
}
