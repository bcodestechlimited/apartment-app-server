import type { Request, Response } from "express";
import { PaymentService } from "../../services/payment.service";
import { WebhookService } from "./webhook.service";

export class WebhookController {
  // Handle Paystack webhook events
  static async handlePaystackWebhook(req: Request, res: Response) {
    await PaymentService.verifyPaystackSignature(req);

    const result = await WebhookService.handlePaystackWebhook(req.body);

    // 3. Send HTTP Response (Services don't do this)
    res.status(200).json(result);
  }
}
