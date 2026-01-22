import agenda from "../lib/agenda";
import type { Job } from "agenda";
import { mailService } from "../services/mail.service";
import logger from "../utils/logger";
import BookingRequest from "../modules/booking-request/booking-request.model";
import Property from "../modules/property/property.model";

export interface SendBookingRequestData {
  landlordName: string;
  landlordEmail: string;
  tenantName: string;
  tenantEmail: string;
  propertyTitle: string;
  moveInDate: string;
  landlordDashboardUrl: string;
  tenantDashboardUrl: string;
  bookingRequestId: string;
  propertyId: string;
  tenantUserId: string;
  retriesLeft?: number; // Optional, used for retry logic
}

const MAX_RETRIES = 3;
const SECONDS = 30;

export const sendBookingRequestToLandlord = async (
  job: Job<SendBookingRequestData>,
  done: (error?: Error) => void,
) => {
  const {
    landlordName,
    landlordEmail,
    propertyTitle,
    moveInDate,
    landlordDashboardUrl,
    retriesLeft = MAX_RETRIES,
  } = job.attrs.data;

  logger.info(
    `Running job to send booking request to landlord - Name: ${
      landlordName ?? "Landlord"
    }, Email: ${landlordEmail}`,
  );

  try {
    const result = await mailService.sendBookingRequestEmailToLandlord({
      landlordName,
      landlordEmail,
      propertyTitle,
      moveInDate,
      landlordDashboardUrl,
    });
    logger.info(`Email sent to ${landlordEmail}`, { result });
    logger.info(`Removing job...`);
    await job.remove();
    logger.info(`Job removed`);
    return done();
  } catch (err) {
    logger.error(
      `Failed to send booking request email to ${landlordEmail}. Retrying in ${SECONDS} seconds. Retries left: ${retriesLeft}`,
      { err },
    );

    logger.error(
      `Next run at: ${new Date(Date.now() + SECONDS * 1000).toLocaleString(
        "en-NG",
      )}`,
    );

    if (job.attrs.data.retriesLeft === undefined) {
      job.attrs.data.retriesLeft = MAX_RETRIES;
    }

    if (job.attrs.data.retriesLeft <= 0) {
      logger.error(
        `Giving up on sending booking request email to ${landlordEmail}: reached ${MAX_RETRIES} failed retries. Removing job...`,
      );
      await job.remove();
      logger.error(`Job removed`);
      return done(err as Error);
    }

    job.attrs.data.retriesLeft -= 1;
    job.schedule(`${SECONDS} seconds from now`);
    await job.save();
    return done();
  }
};

export const sendBookingRequestToTenant = async (
  job: Job<SendBookingRequestData>,
  done: (error?: Error) => void,
) => {
  const {
    tenantName,
    tenantEmail,
    propertyTitle,
    moveInDate,
    tenantDashboardUrl,
    retriesLeft = MAX_RETRIES,
  } = job.attrs.data;

  logger.info(
    `Running job to send booking request to tenant - Name: ${
      tenantName ?? "Anon"
    }, Email: ${tenantEmail}`,
  );

  try {
    const result = await mailService.sendBookingRequestEmailToTenant({
      tenantName,
      tenantEmail,
      propertyTitle,
      moveInDate,
      tenantDashboardUrl,
    });
    logger.info(`Email sent to ${tenantEmail}`);
    logger.info(`Removing job...`);
    await job.remove();
    logger.info(`Job removed`);
    return done();
  } catch (err) {
    logger.error(
      `Failed to send booking request email to ${tenantEmail}. Retrying in ${SECONDS} seconds. Retries left: ${retriesLeft}`,
      { err },
    );

    logger.error(
      `Next run at: ${new Date(Date.now() + SECONDS * 1000).toLocaleString(
        "en-NG",
      )}`,
    );

    if (job.attrs.data.retriesLeft === undefined) {
      job.attrs.data.retriesLeft = MAX_RETRIES;
    }

    if (job.attrs.data.retriesLeft <= 0) {
      logger.error(
        `Giving up on sending booking request email to ${tenantEmail}: reached ${MAX_RETRIES} failed retries. Removing job...`,
      );
      await job.remove();
      logger.error(`Job removed`);
      return done(err as Error);
    }

    job.attrs.data.retriesLeft -= 1;
    job.schedule(`${SECONDS} seconds from now`);
    await job.save();
    return done();
  }
};

export const expireBookingRequestAfter24Hours = async (
  job: Job<SendBookingRequestData>,
) => {
  const { bookingRequestId, propertyId, tenantUserId } = job.attrs.data;
  // Expire the booking request
  await BookingRequest.findByIdAndUpdate(bookingRequestId, {
    status: "expired",
  });

  // Remove user from the property
  await Property.findByIdAndUpdate(
    { _id: propertyId },
    { $pull: { users: tenantUserId } },
  );

  await job.remove();
  logger.info(`Job removed: ${job.attrs.name}`);
};

export const scheduleBookingRequest = async (data: SendBookingRequestData) => {
  await agenda.now("send_booking_request_to_landlord", data);
  await agenda.now("send_booking_request_to_tenant", data);
  await agenda.schedule(
    "24 hours from now",
    "expire_booking_request_after_24_hours",
    data,
  );
};
