import { env } from "@/config/env.config";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2({
  clientId: env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${env.SERVER_BASE_URL}/api/v1/auth/google/callback`,
});

const scopes = ["profile", "email"];

export const generateGoogleAuthURL = () => {
  console.log(`${env.SERVER_BASE_URL}/api/v1/auth/google/callback`);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
};

export const getGoogleUserData = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();

  console.log({ data });

  return data;
};
