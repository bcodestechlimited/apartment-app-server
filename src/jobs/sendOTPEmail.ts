import type { Job } from "agenda";
import logger from "../utils/logger";
import { mailService } from "../services/mail.service";

const MAX_RETRIES = 3;
const SECONDS = 30;

export interface OTPEmailJobData {
  email: string;
  username: string;
  retriesLeft?: number;
}

export const sentOTPEmailJob = async (
  job: Job<OTPEmailJobData>,
  done: (error?: Error) => void
) => {
  const { email, username, retriesLeft = MAX_RETRIES } = job.attrs.data;

  console.log(`Running job to send OTP email to ${email}`);
  console.log({ retriesLeft, MAX_RETRIES });

  try {
    // throw new Error("Simulated error for testing"); // Simulate an error for testing
    const result = await mailService.sendOTPViaEmail({
      email,
      userName: username,
    });
    logger.info(`Email sent to ${email}`, { result });
    return done();
  } catch (err) {
    logger.error(
      `Failed job: ${job.attrs.name}. Retrying in ${SECONDS} seconds. Retries left: ${retriesLeft}`,
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
      logger.error(`Job removed: ${job.attrs.name}.`);
      return done(err as Error);
    }

    job.schedule(`${SECONDS} seconds from now`);
    job.attrs.data.retriesLeft = retriesLeft - 1;
    await job.save();
    return done();
  }
};
