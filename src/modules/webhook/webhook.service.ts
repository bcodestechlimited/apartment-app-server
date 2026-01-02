import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import { TransactionService } from "../transaction/transaction.service";

export class WebhookService {
  // Handle Paystack webhook events
  static async handlePaystackWebhook(event: any) {
    // try {
    const { reference, transfer_code } = event.data;

    let updatedTransaction;

    switch (event.event) {
      case "transfer.success":
        updatedTransaction = await TransactionService.updateTransactionStatus(
          reference,
          "success",
          {
            description: `Paystack Transfer Successful. Code: ${transfer_code}`,
          }
        );
        break;

      case "transfer.failed":
      case "transfer.reversed":
        updatedTransaction = await TransactionService.updateTransactionStatus(
          reference,
          "failed",
          {
            reason: "Paystack transfer failed or was reversed by the bank.",
          }
        );
        break;

      default:
        // If the event is not one we handle, just return a generic success
        return ApiSuccess.ok("Event received but no action required");
    }

    return ApiSuccess.ok("Webhook processed successfully", updatedTransaction);
    // } catch (error: any) {
    //   // Log the error for internal tracking
    //   console.error(`[Webhook Error]: ${error.message}`);

    //   throw ApiError.badRequest(error.message || "Webhook processing failed");
    // }
  }
}

export const webhookService = new WebhookService();
