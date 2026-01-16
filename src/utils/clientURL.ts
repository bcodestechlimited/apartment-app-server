import { env } from "@/config/env.config";

const CLIENT_BASE_URL = `${env.CLIENT_BASE_URL}`;

export const clientURLs = {
  landlord: {
    dashboardURL: `${CLIENT_BASE_URL}/dashboard/landlord`,
    bookingsURL: `${CLIENT_BASE_URL}/dashboard/landlord/bookings`,
    bookingRequestsURL: `${CLIENT_BASE_URL}/dashboard/landlord/bookings/requests`,
  },
  tenant: {
    dashboardURL: `${CLIENT_BASE_URL}/dashboard`,
    bookingsURL: `${CLIENT_BASE_URL}/dashboard/tenant/bookings`,
    bookingRequestsURL: `${CLIENT_BASE_URL}/dashboard/bookings/requests`,
  },
  admin: {
    dashboardURL: `${CLIENT_BASE_URL}/dashboard/admin`,
  },
  onboarding: {
    roleSelectionURL: `${CLIENT_BASE_URL}/onboarding/google`,
  },
  landingPageURL: `${CLIENT_BASE_URL}/`,
  loginURL: `${CLIENT_BASE_URL}/login`,
};
