import mongoose from "mongoose";
import { env } from "./env.config";
import logger from "../utils/logger";

const isProdOrStaging =
  env.NODE_ENV === "production" || env.NODE_ENV === "staging";
const isProd = env.NODE_ENV === "production";

if (process.versions.bun && !isProdOrStaging) {
  (async () => {
    const dns = await import("node:dns");
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    logger.info("🌐 Custom DNS servers set for Bun environment");
  })();
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    logger.info("DB already connected");
    return;
  }

  try {
    logger.info("Connecting...");
    await mongoose.connect(env.MONGODB_URI, {
      dbName: isProd ? "Haven-Lease" : "Haven-Lease-Staging",
      // "Haven-Lease",
    });
    logger.info("DB Connected!");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
