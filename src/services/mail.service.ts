import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OTP from "../modules/otp/otp.model.js";
import generateOTP from "../utils/generateOTP.js";
import transporter from "../lib/transporter.js";
import type { SentMessageInfo, Transporter } from "nodemailer";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = transporter;
  }

  private static loadTemplate(templateName: string, data: object): string {
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      `${templateName}.html`
    );
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const compiledTemplate = handlebars.compile(templateSource);
    return compiledTemplate(data);
  }

  public async sendEmail({
    to,
    subject,
    text,
    html,
    from,
  }: EmailOptions): Promise<SentMessageInfo> {
    try {
      const mailOptions = {
        from: from || "Admin@BCT.com",
        to,
        subject,
        text,
        html,
      };

      const sentMessageInfo = await this.transporter.sendMail(mailOptions);
      return sentMessageInfo;
    } catch (error) {
      logger.fatal("Error sending email:", error);
      throw error;
    }
  }

  public async sendOTPViaEmail({
    email,
    userName,
  }: {
    email: string;
    userName: string;
  }): Promise<SentMessageInfo> {
    await OTP.findOneAndDelete({ email });

    const otp = generateOTP();
    await OTP.create({ email, otp });

    const subject = "OTP Request";
    const date = new Date().toLocaleString();
    const emailText = `Hello ${userName},\n\nYour OTP is: ${otp}`;

    const html = MailService.loadTemplate("OTPTemplate", {
      userName,
      otp,
      date,
    });

    return await this.sendEmail({
      to: email,
      subject,
      text: emailText,
      html,
    });
  }

  public async sendBookingRequestEmailToLandlord({
    landlordName,
    landlordEmail,
    propertyName,
    moveInDate,
    landlordDashboardUrl,
  }: {
    landlordName: string;
    landlordEmail: string;
    propertyName: string;
    moveInDate: string;
    landlordDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Booking Request - ${propertyName}`;
    const date = new Date().getFullYear().toString();
    // const date = new Date().toLocaleString(); // shown in the footer

    // Plain‑text fallback
    const emailText = [
      `Dear ${landlordName},`,
      ``,
      `A prospective tenant has requested to book a viewing for your property "${propertyName}".`,
      `Preferred move-in date: ${moveInDate}`,
      ``,
      `You have 24 hours to accept or decline this request.`,
      `Respond here: ${landlordDashboardUrl}`,
      ``,
      `If accepted, the tenant will be prompted to pay their booking fee.`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    // HTML body (handlebars template in /templates/BookingRequestTemplate.html)
    const html = MailService.loadTemplate("BookingRequestToLandlord", {
      landlordName: !landlordName ? "There" : landlordName,
      propertyName,
      moveInDate,
      landlordDashboardUrl,
      date,
    });

    return await this.sendEmail({
      to: landlordEmail,
      subject,
      text: emailText,
      html,
    });
  }

  public async sendBookingRequestEmailToTenant({
    tenantName,
    tenantEmail,
    propertyName,
    moveInDate,
    tenantDashboardUrl,
  }: {
    tenantName: string;
    tenantEmail: string;
    propertyName: string;
    moveInDate: string;
    tenantDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Booking Request Received - ${propertyName}`;
    const date = new Date().getFullYear().toString();

    const emailText = [
      `Dear ${tenantName},`,
      ``,
      `Your booking request for "${propertyName}" has been sent successfully.`,
      `Preferred move-in date: ${moveInDate}`,
      ``,
      `The landlord has 24 hours to respond to your request.`,
      `You can track the status here: ${tenantDashboardUrl}`,
      ``,
      `If your request is accepted, you’ll be prompted to pay your booking fee to secure the property.`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("BookingRequestToTenant", {
      tenantName: !tenantName ? "There" : tenantName,
      propertyName,
      moveInDate,
      tenantDashboardUrl,
      date,
    });

    return await this.sendEmail({
      to: tenantEmail,
      subject,
      text: emailText,
      html,
    });
  }

  public async sendBookingRequestDeclinedEmailToTenant({
    tenantEmail,
    tenantName,
    propertyName,
  }: {
    tenantEmail: string;
    tenantName: string;
    propertyName: string;
  }): Promise<SentMessageInfo> {
    const subject = `Booking Request Declined - ${propertyName}`;
    const date = new Date().getFullYear().toString(); // for footer

    const emailText = [
      `Dear ${tenantName},`,
      ``,
      `Unfortunately, your booking request for "${propertyName}" was declined by the landlord.`,
      ``,
      `You may explore other listings on Heaven Lease.`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("BookingDeclined", {
      tenantName: !tenantName ? "There" : tenantName,
      propertyName,
      date,
    });

    return await this.sendEmail({
      to: tenantEmail,
      subject,
      text: emailText,
      html,
    });
  }

  public async sendPaymentReminderEmailToTenant({
    tenantEmail,
    tenantName,
    propertyName,
    tenantDashboardUrl,
    // bookingRequestId,
    paymentDue,
  }: {
    tenantEmail: string;
    tenantName: string;
    propertyName: string;
    bookingRequestId: string;
    tenantDashboardUrl: string;
    paymentDue: Date;
  }): Promise<SentMessageInfo> {
    const subject = `Payment Reminder for ${propertyName}`;
    const date = new Date().toLocaleString();

    const emailText = [
      `Dear ${tenantName},`,
      ``,
      `This is a friendly reminder that your payment for the booking request "${propertyName}" is due on ${paymentDue.toLocaleDateString()}.`,
      `Please ensure you complete the payment to secure your booking.`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("PaymentReminder", {
      tenantName: !tenantName ? "There" : tenantName,
      propertyName,
      tenantDashboardUrl,
      // bookingRequestId,
      paymentDue: paymentDue.toLocaleDateString(),
      date,
    });

    return await this.sendEmail({
      to: tenantEmail,
      subject,
      text: emailText,
      html,
    });
  }

  public async sendPaymentConfirmationToTenant({
    tenantEmail,
    tenantName,
    propertyName,
    moveInDate,
    tenantDashboardUrl,
  }: {
    tenantEmail: string;
    tenantName: string;
    propertyName: string;
    moveInDate: string;
    tenantDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Payment Successful - ${propertyName}`;
    const date = new Date().getFullYear().toString();

    const emailText = [
      `Dear ${tenantName},`,
      ``,
      `Your payment for "${propertyName}" has been received successfully.`,
      `Move-in date: ${moveInDate}`,
      ``,
      `Your booking is now confirmed.`,
      `You can view your booking details here: ${tenantDashboardUrl}`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("TenantPaymentConfirmation", {
      tenantName: !tenantName ? "There" : tenantName,
      propertyName,
      moveInDate,
      tenantDashboardUrl,
      date,
    });

    return await this.sendEmail({
      to: tenantEmail,
      subject,
      text: emailText,
      html,
    });
  }

  public async sendPaymentReceivedNotificationToLandlord({
    landlordName,
    landlordEmail,
    propertyName,
    moveInDate,
    tenantName,
    landlordDashboardUrl,
  }: {
    landlordEmail: string;
    landlordName: string;
    propertyName: string;
    moveInDate: string;
    tenantName: string;
    landlordDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Payment Received for ${propertyName}`;
    const date = new Date().getFullYear().toString();

    const emailText = [
      `Dear ${landlordName},`,
      ``,
      `The tenant ${tenantName} has completed payment for the property "${propertyName}".`,
      `Move-in date: ${moveInDate}`,
      ``,
      `You can view booking details here: ${landlordDashboardUrl}`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("LandlordPaymentReceived", {
      landlordName: !landlordName ? "There" : landlordName,
      tenantName,
      propertyName,
      moveInDate,
      landlordDashboardUrl,
      date,
    });

    return await this.sendEmail({
      to: landlordEmail,
      subject,
      text: emailText,
      html,
    });
  }
}

export const mailService = new MailService();
