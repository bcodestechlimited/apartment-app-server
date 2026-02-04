import { Job } from "agenda";
import { mailService } from "../services/mail.service";
import { env } from "../config/env.config";
import SystemSettings from "../modules/system-settings/system-settings.model";
import logger from "@/utils/logger";

const MAX_RETRIES = 3;
const SECONDS = 30;

export interface PropertyUpdateAlertData {
  propertyId: string;
  propertyTitle: string;
  landlordName: string;
  retriesLeft?: number;
}

export const PROPERTY_UPDATE_ALERT = "PROPERTY_UPDATE_ALERT";

export const sendPropertyUpdateAlertJob = async (
  job: Job<PropertyUpdateAlertData>,
  done: (error?: Error) => void,
) => {
  const {
    propertyId,
    propertyTitle,
    landlordName,
    retriesLeft = MAX_RETRIES,
  } = job.attrs.data;

  logger.info(
    `Running job to send property update alert to Admin - Property: ${propertyTitle}`,
  );

  try {
    const settings = await SystemSettings.findOne();
    const adminEmail = settings?.supportEmail || env.ADMIN_EMAIL;

    if (!adminEmail) {
      logger.error(`Job Failed: No admin email found in settings or ENV`);
      await job.remove();
      return done();
    }

    const adminDashboardUrl = `${env.CLIENT_BASE_URL}/dashboard/admin/properties/${propertyId}`;

    const result = await mailService.sendAdminPropertyUpdateAlert({
      adminEmail,
      propertyTitle,
      landlordName,
      propertyId,
      adminDashboardUrl,
    });

    logger.info(`Property update alert sent to admin: ${adminEmail}`, {
      result,
    });

    logger.info(`Removing job...`);
    await job.remove();
    logger.info(`Job removed`);
    return done();
  } catch (err) {
    logger.error(
      `Failed job: ${job.attrs.name}. Retrying in ${SECONDS} seconds. Retries left: ${retriesLeft}`,
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
        `Job ${job.attrs.name} failed after ${MAX_RETRIES} retries. Removing job...`,
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
