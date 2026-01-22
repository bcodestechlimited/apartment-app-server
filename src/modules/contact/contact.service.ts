import agenda from "@/lib/agenda";
import type { IContact } from "./contact.interface";
import { ApiError, ApiSuccess } from "@/utils/responseHandler";

export class ContactService {
  static async sendContactUsMail({ name, email, subject, message }: IContact) {
    if (name && email && subject && message) {
      agenda.now("send_contact_us_email", { name, email, subject, message });
      return ApiSuccess.ok("Email sent successfully");
    }
    return ApiError.badRequest("Missing required fields");
  }
}
