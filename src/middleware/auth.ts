import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/token.js";
import asyncWrapper from "./asyncWrapper.js";
import { ApiError } from "../utils/responseHandler.js";
import type { AuthenticatedUser } from "@/modules/user/user.interface.js";

const isAuth = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // const authHeader = req.headers.authorization;

    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   throw ApiError.unauthorized("No Token Provided");
    // }
    // const token = authHeader.split(" ")[1];

    const token = req.cookies.token;

    if (!token) {
      throw ApiError.unauthorized("No Token Provided");
    }

    const payload = verifyToken(token as string);

    req.user = payload;
    next();
  }
);

const isAuthAdmin = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roles } = req.user as AuthenticatedUser;

    if (!roles.includes("admin")) {
      throw ApiError.forbidden("You are not authorized to access this route");
    }
    next();
  }
);

export { isAuth, isAuthAdmin };
