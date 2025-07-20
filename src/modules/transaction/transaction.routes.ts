import express from "express";

import { isAuth } from "@/middleware/auth.js";
import methodNotAllowed from "@/middleware/methodNotAllowed.js";
import { TransactionController } from "./transaction.controller";

const router = express.Router();

router
  .route("/")
  .get(isAuth, TransactionController.getUserTransactions) // Get transactions for the authenticated user
  .all(methodNotAllowed);

router
  .route("/:transactionId")
  .get(isAuth, TransactionController.getTransactionById) // Get a single transaction by ID
  .all(methodNotAllowed);

export default router;
