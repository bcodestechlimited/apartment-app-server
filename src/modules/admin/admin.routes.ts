import express from "express";
import { isAuth, isAuthAdmin } from "@/middleware/auth.js";
import methodNotAllowed from "@/middleware/methodNotAllowed.js";
import { WalletController } from "../wallet/wallet.controller";
import { TransactionController } from "../transaction/transaction.controller";
import { UserController } from "../user/user.controller";
import { PropertyController } from "../property/property.controller";
import { LandlordRatingController } from "../landlord-rating/landlord-rating.controller";

const router = express.Router();

// Users
router
  .route("/users")
  .get(isAuth, UserController.getAllUsers)
  .all(methodNotAllowed);
router
  .route("/users/:userId")
  .get(isAuth, UserController.getUserById)
  .all(methodNotAllowed);

// Transactions
router
  .route("/transactions")
  .get(isAuth, TransactionController.getAllTransactions)
  .all(methodNotAllowed);

router
  .route("/transactions/:transactionId")
  .get(isAuth, TransactionController.getTransactionById)
  .all(methodNotAllowed);

//Wallet
router
  .route("/wallet")
  .get(isAuth, WalletController.getAllWallets)
  .all(methodNotAllowed);
router
  .route("/wallet/block/:userId")
  .put(isAuth, WalletController.blockUserWallet)
  .all(methodNotAllowed);
router
  .route("/wallet/unblock/:userId")
  .put(isAuth, WalletController.unBlockUserWallet)
  .all(methodNotAllowed);

//Property
router
  .route("/property")
  .get(isAuth, isAuthAdmin, PropertyController.getAllProperties)
  .all(methodNotAllowed);

router
  .route("/property/:propertyId")
  .patch(isAuth, isAuthAdmin, PropertyController.adminUpdateProperty)
  .all(methodNotAllowed);
router
  .route("/rating/:landlordId")
  .get(isAuth, isAuthAdmin, LandlordRatingController.getAllRatings)
  .all(methodNotAllowed);

export default router;
