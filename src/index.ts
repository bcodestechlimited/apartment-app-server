import express from "express";
import logger from "./utils/logger";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.config";
import connectDB from "./config/connectDB";
import notFound from "./middleware/notFound";
import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middleware/error";
import agenda from "./lib/agenda";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v1/auth", authRoutes);

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
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
