import { env } from "@/config/env.config";
import { google } from "googleapis";

export interface AuthStateOptions {
  role?: string;
  redirect?: string;
}

const oauth2Client = new google.auth.OAuth2({
  clientId: env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${env.SERVER_BASE_URL}/api/v1/auth/google/callback`,
});

const scopes = ["profile", "email"];

export const generateGoogleAuthURL = (options: AuthStateOptions) => {
  console.log(`${env.SERVER_BASE_URL}/api/v1/auth/google/callback`);

  if (!options || Object.keys(options).length === 0) {
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
    });
  }

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    // JSON.stringify automatically ignores keys with 'undefined' values
    state: Buffer.from(JSON.stringify(options)).toString("base64"),
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
