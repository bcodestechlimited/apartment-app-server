import { Agenda } from "agenda";
import { env } from "../config/env.config";
import { mailService } from "../services/mail.service";
import logger from "../utils/logger";

const agenda = new Agenda({
  db: { address: env.MONGODB_URI, collection: "agendaJobs" },
  processEvery: "30 seconds",
});

agenda.define("send_otp_email", async (job, done) => {
  const { email, username } = job.attrs.data as {
    email: string;
    username: string;
  };

  console.log(`Running job to send OTP email to ${email}`);

  try {
    const result = await mailService.sendOTPViaEmail(email, username);
    logger.info(`Email sent to ${email}`, { result });
    done();
  } catch (err) {
    logger.error(`Failed to send OTP to ${email}:`, { err });
    throw err; // causes retry
  }
});

export const startAgenda = async () => {
  await agenda.start();
  console.log("✅ Agenda started");

  // Log all jobs to check if it's running
  const jobs = await agenda.jobs({});
  console.log(`📋 Found ${jobs.length} jobs:`);
  jobs.forEach((job, i) => {
    console.log(
      `[${i + 1}] ${job.attrs.name} | nextRunAt: ${job.attrs.nextRunAt}`
    );
  });
};

export default agenda;
