import express from "express";
import logger from "./utils/logger";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { createServer } from "http";

import connectDB from "./config/connectDB";
import notFound from "./middleware/notFound";
import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middleware/error";
import { startAgenda } from "./lib/agenda";

//Routes
import propertyRoutes from "./modules/property/property.routes";
import bookingRoutes from "./modules/booking/booking.routes";
import bookingRequestRoutes from "./modules/booking-request/booking-request.routes";
import transactionRoutes from "./modules/transaction/transaction.routes";
import walletRoutes from "./modules/wallet/wallet.routes";
import tenantRoutes from "./modules/tenant/tenant.routes";
import messageRoutes from "./modules/message/message.routes";
import webookRoutes from "./modules/webhook/webhook.routes";
import adminRoutes from "./modules/admin/admin.routes";
import { initializeSocket } from "./lib/socket";
import landlordRatingRouter from "./modules/landlord-rating/landlord-rating.routes";
import propertyRatingRouter from "./modules/property-rating/property-rating.routes";
import tenantRatingRouter from "./modules/tenant-rating/tenant-rating.routes";
import ReportRouter from "./modules/report/report.routes";
// import favouriteRouter from "./modules/favourite/favourite.route";
import savedPropertiesRouter from "./modules/saved-properties/saved-properties.routes";
const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // Limits file size to 50MB
    useTempFiles: true,
    tempFileDir: "/tmp/",
    parseNested: true,
    // debug: true,
  })
);
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://apartment-app-client.vercel.app",
      "https://www.havenlease.com",
      "https://havenlease.com",
    ],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.get("/", (req, res) => {
  res.send("Api is running");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/property", propertyRoutes);
app.use("/api/v1/booking", bookingRoutes);
app.use("/api/v1/booking-request", bookingRequestRoutes);
app.use("/api/v1/transaction", transactionRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/webhook", webookRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/landlord-rating", landlordRatingRouter);
app.use("/api/v1/property-rating", propertyRatingRouter);
app.use("/api/v1/tenant-rating", tenantRatingRouter);
app.use("/api/v1/save-properties", savedPropertiesRouter);
app.use("/api/v1/report", ReportRouter);
// app.use("/api/v1/favourite", favouriteRouter);

// Admin routes

app.use(helmet());
app.use(notFound);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(port, async () => {
      logger.info(`Server is listening on PORT:${port}`);
      initializeSocket(server);
      startAgenda();
    });
  } catch (error) {
    logger.error(error);
  }
};

startServer();
