import express from "express";
import logger from "./utils/logger";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import { env } from "./config/env.config";
import connectDB from "./config/connectDB";
import notFound from "./middleware/notFound";
import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middleware/error";
import agenda from "./lib/agenda";

//Routes
import propertyRoutes from "./modules/property/property.routes";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // Limits file size to 50MB
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use(morgan("dev"));
app.get("/", (req, res) => {
  res.send("Api is running");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/property", propertyRoutes);

app.use(helmet());
app.use(notFound);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, async () => {
      logger.info(`Server is listening on PORT:${env.PORT}`);
      agenda.start();
      logger.info("Agenda started");
    });
  } catch (error) {
    logger.error(error);
  }
};

startServer();
