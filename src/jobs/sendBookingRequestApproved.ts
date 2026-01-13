import agenda from "../lib/agenda";
import type { Job } from "agenda";
import { mailService } from "../services/mail.service";
import logger from "../utils/logger";

export interface SendBookingRequestApprovalData {
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

export const sendBookingRequestApprovalEmailToTenant = async (
  job: Job<SendBookingRequestApprovalData>,
  done: (error?: Error) => void
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
    `Running job to send booking request approval email to tenant - Name: ${
      tenantName ?? "Anon"
    }, Email: ${tenantEmail}`
  );

  try {
    const result = await mailService.sendBookingRequestApprovalEmailToTenant({
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
      { err }
    );

    logger.error(
      `Next run at: ${new Date(Date.now() + SECONDS * 1000).toLocaleString(
        "en-NG"
      )}`
    );

    if (job.attrs.data.retriesLeft === undefined) {
      job.attrs.data.retriesLeft = MAX_RETRIES;
    }

    if (job.attrs.data.retriesLeft <= 0) {
      logger.error(
        `Giving up on sending booking request email to ${tenantEmail}: reached ${MAX_RETRIES} failed retries. Removing job...`
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

export const scheduleBookingRequestApprovalEmailToTenant = async (
  data: SendBookingRequestApprovalData
) => {
  await agenda.now("send_booking_request_approved_to_tenant", data);
  await agenda.schedule(
    "4 hours from now",
    "send_payment_reminder_to_tenant",
    data
  );
};
