import agenda from "../lib/agenda";
import type { Job } from "agenda";
import { mailService } from "../services/mail.service";
import logger from "../utils/logger";

export interface SendBookingRequestDeclinedData {
  //   landlordName: string;
  //   landlordEmail: string;
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  //   moveInDate: string;
  //   landlordDashboardUrl: string;
  //   tenantDashboardUrl: string;
  retriesLeft?: number; // Optional, used for retry logic
}

export const sendBookingRequestDeclinedEmailToTenant = async (
  job: Job<SendBookingRequestDeclinedData>,
  done: (error?: Error) => void
) => {
  const { tenantEmail, tenantName, propertyName } = job.attrs.data;

  try {
    const result = await mailService.sendBookingRequestDeclinedEmailToTenant({
      tenantEmail,
      tenantName,
      propertyName,
    });
    logger.info(
      `Booking request declined email sent to tenant email: ${tenantEmail}`,
      {
        result,
      }
    );
    logger.info(`Removing job...`);
    await job.remove();
    logger.info(`Job removed`);
    return done();
  } catch (err) {
    logger.error(`Failed to send booking request declined email to tenant`, {
      err,
    });
    logger.info(`Removing job...`);
    await job.remove();
    logger.info(`Job removed`);
    return done(err as Error);
  }
};

export const scheduleBookingRequestDeclined = async (
  data: SendBookingRequestDeclinedData
) => {
  await agenda.now("send_booking_request_declined_email_to_tenant", data);
};
