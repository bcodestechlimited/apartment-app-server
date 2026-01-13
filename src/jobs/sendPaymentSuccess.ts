import agenda from "../lib/agenda";
import type { Job } from "agenda";
import { mailService } from "../services/mail.service";
import logger from "../utils/logger";

export interface SendPaymentSuccessData {
  landlordName: string;
  landlordEmail: string;
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  moveInDate: string;
  landlordDashboardUrl: string;
  tenantDashboardUrl: string;
  retriesLeft?: number; // Optional, used for retry logic
}

const MAX_RETRIES = 3;
const SECONDS = 30;

export const sendPaymentReceivedToLandlord = async (
  job: Job<SendPaymentSuccessData>,
  done: (error?: Error) => void
) => {
  const {
    landlordName,
    landlordEmail,
    tenantName,
    propertyName,
    moveInDate,
    landlordDashboardUrl,
    retriesLeft = MAX_RETRIES,
  } = job.attrs.data;

  logger.info(
    `Running job to send payment received notification to landlord - 
     Name: ${landlordName}, Email: ${landlordEmail}`
  );

  try {
    const result = await mailService.sendPaymentReceivedNotificationToLandlord({
      landlordName,
      landlordEmail,
      tenantName,
      propertyTitle: propertyName,
      moveInDate,
      landlordDashboardUrl,
    });
    logger.info(`Payment received notification sent to ${landlordEmail}`, {
      result,
    });
    logger.info(`Removing job...`);
    await job.remove();
    logger.info(`Job removed`);
    return done();
  } catch (err) {
    logger.error(
      `Failed job: ${job.attrs.name}. Retrying in ${SECONDS} seconds. Retries left: ${job.attrs.data.retriesLeft}`
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
        `Job ${job.attrs.name} failed after ${MAX_RETRIES} retries. Removing job...`
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

export const sendPaymentConfirmationToTenant = async (
  job: Job<SendPaymentSuccessData>,
  done: (error?: Error) => void
) => {
  const {
    tenantName,
    tenantEmail,
    propertyName,
    moveInDate,
    tenantDashboardUrl,
    retriesLeft = MAX_RETRIES,
  } = job.attrs.data;

  logger.info(
    `Running job to send payment confirmation to tenant - Name: ${tenantName}, Email: ${tenantEmail}`
  );

  try {
    const result = await mailService.sendPaymentConfirmationToTenant({
      tenantName,
      tenantEmail,
      propertyTitle: propertyName,
      moveInDate,
      tenantDashboardUrl,
    });
    logger.info(`Payment confirmation sent to ${tenantEmail}`, { result });
    logger.info(`Removing job...`);
    await job.remove();
    logger.info(`Job removed`);
    return done();
  } catch (err) {
    logger.error(
      `Failed job: ${job.attrs.name}. Retrying in ${SECONDS} seconds. Retries left: ${job.attrs.data.retriesLeft}`
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
        `Job ${job.attrs.name} failed after ${MAX_RETRIES} retries. Removing job...`
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

export const schedulePaymentSuccessEmail = async (
  data: SendPaymentSuccessData
) => {
  await agenda.now("send_payment_received_to_landlord", data);
  await agenda.now("send_payment_confirmation_to_tenant", data);
};
