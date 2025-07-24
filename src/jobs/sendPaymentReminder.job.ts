import type { Job } from "agenda";
import { mailService } from "../services/mail.service";
import logger from "../utils/logger";
import Property from "../modules/property/property.model";
import BookingRequest from "../modules/booking-request/booking-request.model";
import agenda from "../lib/agenda";

const MAX_RETRIES = 3;
const SECONDS = 60; // 1 minute

export interface RemindTenantToPayJobData {
  tenantEmail: string;
  tenantName: string;
  propertyTitle: string;
  bookingRequestId: string;
  paymentDue: Date;
  tenantDashboardUrl: string;
  retriesLeft?: number;
}

export const sendPaymentReminderToTenant = async (
  job: Job<RemindTenantToPayJobData>,
  done: (error?: Error) => void
) => {
  const {
    tenantEmail,
    tenantName,
    propertyTitle,
    bookingRequestId,
    paymentDue,
    tenantDashboardUrl,
    retriesLeft = MAX_RETRIES,
  } = job.attrs.data;

  logger.info(
    `Running job to remind tenant to pay - Email: ${tenantEmail}, Name: ${tenantName}`
  );

  //Check if booking the booking request has been paid
  const bookingRequest = await BookingRequest.findById(bookingRequestId);

  if (!bookingRequest) {
    logger.error(`Booking request ${bookingRequestId} not found.`);
    return done(new Error("Booking request not found"));
  }

  if (
    bookingRequest.paymentStatus === "success" ||
    bookingRequest.paymentStatus === "failed"
  ) {
    logger.info(
      `Payment for booking request ${bookingRequestId} has already been made. Removing job...`
    );
    await job.remove();
    logger.info(`Job removed`);
    return done();
  }

  const withinLast24Hours =
    new Date(paymentDue.getTime() + 24 * 60 * 60 * 1000) > new Date();

  // Somewhat redundant check
  if (!withinLast24Hours) {
    logger.info(
      `Payment for booking request ${bookingRequestId} is overdue. Setting status to expired and removing job....`
    );
    await BookingRequest.findByIdAndUpdate(bookingRequestId, {
      status: "expired",
    });

    await Property.findByIdAndUpdate(bookingRequest.property._id, {
      isAvailable: true,
    });
    logger.info(
      `Property ${bookingRequest.property.description} is now available.`
    );
    await job.remove();
    return done();
  }

  try {
    const timeLeft = paymentDue.getTime() - new Date().getTime();
    const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));

    const result = await mailService.sendPaymentReminderEmailToTenant({
      tenantEmail,
      tenantName,
      propertyTitle,
      bookingRequestId,
      hoursLeft: String(hoursLeft),
      tenantDashboardUrl,
    });

    logger.info(`Payment reminder email sent to ${tenantEmail}`);

    if (hoursLeft > 4) {
      logger.info(
        `Scheduling new reminder in 4 hours for booking request ${bookingRequestId}.`
      );
      job.schedule(`4 hours from now`);
    }

    return done();
  } catch (err) {
    logger.error(
      `Failed job: ${job.attrs.name}. Retrying in ${SECONDS} seconds. Retries left: ${job.attrs.data.retriesLeft}`,
      { err }
    );

    logger.error(
      `Next run at: ${new Date(Date.now() + SECONDS * 1000).toLocaleString(
        "en-NG"
      )}`
    );

    if (retriesLeft <= 0) {
      logger.error(
        `Giving up on ${job.attrs.name}: reached ${MAX_RETRIES} failed retries. Removing job...`
      );
      await job.remove();
      logger.error(`Job removed`);
      return done(err as Error);
    }

    job.schedule(`${SECONDS} seconds from now`);
    job.attrs.data.retriesLeft = retriesLeft - 1;
    await job.save();
    return done();
  }
};

export const scheduleTenantPaymentReminder = async (
  data: RemindTenantToPayJobData
) => {
  await agenda.now("send_payment_reminder_to_tenant", data);
};
