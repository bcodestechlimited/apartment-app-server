import { mailService } from "@/services/mail.service";
import logger from "@/utils/logger";
import type { Job } from "agenda";

export interface ISendContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
  retriesLeft?: number;
}

const MAX_RETRIES = 3;
const SECONDS = 60;

export const sendContactMessage = async (
  job: Job<ISendContactMessageData>,
  done: (error?: Error) => void,
) => {
  const {
    name,
    email,
    subject,
    message,
    retriesLeft = MAX_RETRIES,
  } = job.attrs.data;

  try {
    // ✅ CHANGED: Delegated logic to the service method.
    // This fixes the 'html' undefined error and handles 'replyTo' automatically.
    const result = await mailService.sendContactUsEmail({
      name,
      email,
      subject,
      message,
    });

    logger.info(
      `Contact message sent successfully. MessageID: ${result.messageId}`,
    );
    logger.info(`Removing job...`);
    await job.remove();
    logger.info(`Job removed`);
    return done();
  } catch (err) {
    // Error handling logic remains the same
    logger.error(
      `Failed job: ${job.attrs.name}. Retrying in ${SECONDS} seconds. Retries left: ${retriesLeft}`,
    );
    logger.error(`Failed to send contact message`, { err });
    logger.error(
      `Next run at: ${new Date(Date.now() + SECONDS * 1000).toLocaleString(
        "en-NG",
      )}`,
    );

    if (retriesLeft <= 0) {
      logger.error(
        `Giving up on ${job.attrs.name}: reached ${MAX_RETRIES} failed retries. Removing job...`,
      );
      await job.remove();
      logger.error(`Job removed: ${job.attrs.name}.`);
      return done(err as Error);
    }

    job.schedule(`${SECONDS} seconds from now`);
    job.attrs.data.retriesLeft = retriesLeft - 1;
    await job.save();
    return done();
  }
};
