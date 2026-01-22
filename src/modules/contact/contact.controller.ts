import type { Request, Response } from "express";
import { ContactService } from "./contact.service";

export class ContactController {
  static async sendContactUsMail(req: Request, res: Response) {
    const { name, email, subject, message } = req.body;
    console.log({ name, email, subject, message });
    const result = await ContactService.sendContactUsMail({
      name,
      email,
      subject,
      message,
    });
    res.status(200).json(result);
  }
}
