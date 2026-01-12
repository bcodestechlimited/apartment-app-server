import nodemailer from "nodemailer";
import { env } from "../config/env.config";

// Create and export the nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: env.NODE_ENV === "development" ? 465 : 587,
  auth: {
    user: env.BREVO_EMAIL,
    pass: env.BREVO_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export default transporter;
