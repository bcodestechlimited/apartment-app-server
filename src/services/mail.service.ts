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
  replyTo?: string;
}

class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = transporter;
  }

  private static loadTemplate(templateName: string, data: object): string {
    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      `${templateName}.html`,
    );

    // console.log({
    //   templatePath,
    //   __dirname,
    //   cwd: process.cwd(),
    //   files: fs.readdirSync(path.join(__dirname, "..")),
    // });

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
    replyTo,
  }: EmailOptions): Promise<SentMessageInfo> {
    try {
      const mailOptions = {
        from: from || "Haven Lease <support@hrcoreapp.com>",
        to,
        subject,
        text,
        html,
        replyTo,
      };

      console.log({ mailOptions });

      const sentMessageInfo = await this.transporter.sendMail(mailOptions);
      return sentMessageInfo;
    } catch (error) {
      console.error("Error sending email:", error);
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
    propertyTitle,
    moveInDate,
    landlordDashboardUrl,
  }: {
    landlordName: string;
    landlordEmail: string;
    propertyTitle: string;
    moveInDate: string;
    landlordDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Booking Request - ${propertyTitle}`;
    const date = new Date().getFullYear().toString();
    // const date = new Date().toLocaleString(); // shown in the footer

    // Plain‑text fallback
    const emailText = [
      `Dear ${landlordName},`,
      ``,
      `A prospective tenant has requested to book a viewing for your property "${propertyTitle}".`,
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
      propertyTitle,
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
    propertyTitle,
    moveInDate,
    tenantDashboardUrl,
  }: {
    tenantName: string;
    tenantEmail: string;
    propertyTitle: string;
    moveInDate: string;
    tenantDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Booking Request Received - ${propertyTitle}`;
    const date = new Date().getFullYear().toString();

    const emailText = [
      `Dear ${tenantName},`,
      ``,
      `Your booking request for "${propertyTitle}" has been sent successfully.`,
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
      propertyTitle,
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

  public async sendBookingRequestApprovalEmailToTenant({
    tenantName,
    tenantEmail,
    propertyTitle,
    moveInDate,
    tenantDashboardUrl,
  }: {
    tenantName: string;
    tenantEmail: string;
    propertyTitle: string;
    moveInDate: string;
    tenantDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Booking Request Approved`;
    const date = new Date().getFullYear().toString();

    const emailText = [
      `Dear ${tenantName},`,
      ``,
      `Your booking request for "${propertyTitle}" has been approved.`,
      `Preferred move-in date: ${moveInDate}`,
      ``,
      `Please proceed with payment to secure your booking.`,
      `You can do this here: ${tenantDashboardUrl}`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("BookingApprovalEmailToTenant", {
      tenantName: !tenantName ? "There" : tenantName,
      propertyTitle,
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
    propertyTitle,
  }: {
    tenantEmail: string;
    tenantName: string;
    propertyTitle: string;
  }): Promise<SentMessageInfo> {
    const subject = `Booking Request Declined - ${propertyTitle}`;
    const date = new Date().getFullYear().toString(); // for footer

    const emailText = [
      `Dear ${tenantName},`,
      ``,
      `Unfortunately, your booking request for "${propertyTitle}" was declined by the landlord.`,
      ``,
      `You may explore other listings on Heaven Lease.`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("BookingDeclined", {
      tenantName: !tenantName ? "There" : tenantName,
      propertyTitle,
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
    propertyTitle,
    tenantDashboardUrl,
    // bookingRequestId,
    hoursLeft,
  }: {
    tenantEmail: string;
    tenantName: string;
    propertyTitle: string;
    bookingRequestId: string;
    tenantDashboardUrl: string;
    hoursLeft: string;
  }): Promise<SentMessageInfo> {
    const subject = `Payment Reminder for ${propertyTitle}`;
    const date = new Date().getFullYear().toString();

    const emailText = [
      `Hi ${tenantName},`,
      ``,
      `This is a friendly reminder that payment is due for your booking request for "${propertyTitle}".`,
      `You have ${hoursLeft} hours left to make the payment. If payment is not received, the booking request will automatically expire.`,
      `Please access your dashboard to make the payment as soon as possible to ensure a smooth booking experience.`,
      ``,
      `Best regards,`,
      `Haven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("PaymentReminder", {
      tenantName: !tenantName ? "There" : tenantName,
      propertyTitle,
      tenantDashboardUrl,
      // bookingRequestId,
      hoursLeft: hoursLeft,
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
    propertyTitle,
    moveInDate,
    tenantDashboardUrl,
  }: {
    tenantEmail: string;
    tenantName: string;
    propertyTitle: string;
    moveInDate: string;
    tenantDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Payment Successful - ${propertyTitle}`;
    const date = new Date().getFullYear().toString();

    const emailText = [
      `Dear ${tenantName},`,
      ``,
      `Your payment for "${propertyTitle}" has been received successfully.`,
      `Move-in date: ${moveInDate}`,
      ``,
      `Your booking is now confirmed.`,
      `You can view your booking details here: ${tenantDashboardUrl}`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("TenantPaymentConfirmation", {
      tenantName: !tenantName ? "There" : tenantName,
      propertyTitle,
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
    propertyTitle,
    moveInDate,
    tenantName,
    landlordDashboardUrl,
  }: {
    landlordEmail: string;
    landlordName: string;
    propertyTitle: string;
    moveInDate: string;
    tenantName: string;
    landlordDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `Payment Received for ${propertyTitle}`;
    const date = new Date().getFullYear().toString();

    const emailText = [
      `Dear ${landlordName},`,
      ``,
      `The tenant ${tenantName} has completed payment for the property "${propertyTitle}".`,
      `Move-in date: ${moveInDate}`,
      ``,
      `You can view booking details here: ${landlordDashboardUrl}`,
      ``,
      `— Heaven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("LandlordPaymentReceived", {
      landlordName: !landlordName ? "There" : landlordName,
      tenantName,
      propertyTitle,
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

  public async sendContactUsEmail({
    name,
    email,
    subject,
    message,
  }: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<SentMessageInfo> {
    const adminEmail =
      process.env.CONTACT_EMAIL || "eguavoenemmanuel2019@gmail.com";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">New Contact Message</h2>
        <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px;">
          <strong>Message:</strong><br/>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `;

    // 2. Send the email
    return await this.sendEmail({
      to: adminEmail,
      from: adminEmail,
      replyTo: email,
      subject: `New Contact Msg: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: htmlContent,
    });
  }

  public async sendAdminPropertyUpdateAlert({
    adminEmail,
    propertyTitle,
    landlordName,
    propertyId,
    adminDashboardUrl,
  }: {
    adminEmail: string;
    propertyTitle: string;
    landlordName: string;
    propertyId: string;
    adminDashboardUrl: string;
  }): Promise<SentMessageInfo> {
    const subject = `🚨 Action Required: Property Updated - ${propertyTitle}`;
    const date = new Date().getFullYear().toString();

    // 1. Plain text fallback
    const emailText = [
      `Dear Admin,`,
      ``,
      `The property "${propertyTitle}" has been updated by ${landlordName}.`,
      `As a result, its verification status has been reset and requires your review.`,
      ``,
      `Review property here: ${adminDashboardUrl}`,
      ``,
      `— Haven Lease Team`,
    ].join("\n");

    const html = MailService.loadTemplate("PropertyUpdateAlert", {
      adminName: "Admin",
      propertyTitle,
      landlordName,
      propertyId,
      adminDashboardUrl,
      date,
    });

    return await this.sendEmail({
      to: adminEmail,
      subject,
      text: emailText,
      html,
    });
  }
}

export const mailService = new MailService();
