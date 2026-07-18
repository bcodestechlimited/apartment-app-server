import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import { verifyToken } from "../config/token.js";
// import asyncWrapper from "./asyncWrapper.js";
import { ApiError } from "../utils/responseHandler.js";
import type { AuthenticatedUser } from "@/modules/user/user.interface.js";

const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  logger.info({ cookies: req.cookies }, "Checking authentication for request");

  const token = req.cookies.token;

  if (!token) {
    logger.warn("No token provided in cookies");
    throw ApiError.unauthorized("No Token Provided");
  }

  try {
    const payload = verifyToken(token as string);
    logger.info({ user: payload }, "Token verified successfully");

    req.user = payload;
    next();
  } catch (error) {
    logger.error({ error, token }, "Token verification failed");
    throw ApiError.unauthorized("Invalid Token");
  }
};

const isAuthAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    logger.warn("isAuthAdmin called without user on request");
    throw ApiError.unauthorized("User not authenticated");
  }
  const { roles } = req.user as AuthenticatedUser;

  if (!roles.includes("admin")) {
    logger.warn({ user: req.user }, "Forbidden: User does not have admin role");
    throw ApiError.forbidden("You are not authorized to access this route");
  }
  next();
};

const isLandlord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    logger.warn("isLandlord called without user on request");
    throw ApiError.unauthorized("User not authenticated");
  }
  const { roles } = req.user as AuthenticatedUser;

  if (!roles.includes("landlord")) {
    logger.warn(
      { user: req.user },
      "Forbidden: User does not have landlord role",
    );
    throw ApiError.forbidden("You are not authorized to access this route");
  }
  next();
};

const isTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    logger.warn("isTenant called without user on request");
    throw ApiError.unauthorized("User not authenticated");
  }
  const { roles } = req.user as AuthenticatedUser;

  if (!roles.includes("tenant")) {
    logger.warn(
      { user: req.user },
      "Forbidden: User does not have tenant role",
    );
    throw ApiError.forbidden("You are not authorized to access this route");
  }
  next();
};

export { isAuth, isAuthAdmin, isLandlord, isTenant };
