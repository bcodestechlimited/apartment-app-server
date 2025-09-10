import { cleanEnv, port, str } from "envalid";

export const env = cleanEnv(Bun.env, {
  MONGODB_URI: str(),
  BREVO_EMAIL: str(),
  BREVO_PASSWORD: str(),
  NODE_ENV: str({
    choices: ["development", "production", "test"],
  }),
  PORT: port() || 3000,
  JWT_SECRET: str(),
  JWT_EXPIRES: str(),
  CORS_ORIGIN: str(),
  SERVER_BASE_URL: str(),
  CLIENT_BASE_URL: str(),
  CLOUDINARY_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),
  PAYSTACK_SECRET_KEY: str(),
  PAYSTACK_PUBLIC_KEY: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
});
