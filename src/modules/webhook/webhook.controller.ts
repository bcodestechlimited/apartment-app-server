import type { Request, Response } from "express";
import { PaymentService } from "../../services/payment.service";

export class WebhookController {
  // Handle Paystack webhook events
  static async handlePaystackWebhook(req: Request, res: Response) {
    await PaymentService.verifyPaystackSignature(req);

    const webhookData = req.body;
    res.status(200).json({});
  }
}
