import express from "express";
import { isAuth, isAuthAdmin } from "@/middleware/auth.js";
import methodNotAllowed from "@/middleware/methodNotAllowed.js";
import { WalletController } from "../wallet/wallet.controller";
import { TransactionController } from "../transaction/transaction.controller";
import { UserController } from "../user/user.controller";
import { PropertyController } from "../property/property.controller";
import { LandlordRatingController } from "../landlord-rating/landlord-rating.controller";
import { AuthController } from "../auth/auth.controller";
import { ReportController } from "../report/report.controller";
import { BookingController } from "../booking/booking.controller";

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
  .route("/transactions/overview")
  .get(isAuth, TransactionController.getPaymentOverview)
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
  .route("/properties/:landlordId")
  .get(
    isAuth,
    isAuth,
    isAuthAdmin,
    PropertyController.getAllLandlordPropertiesByAdmin
  )
  .all(methodNotAllowed);

//Rating
router
  .route("/rating/:landlordId")
  .get(isAuth, isAuthAdmin, LandlordRatingController.getAllRatings)
  .all(methodNotAllowed);

//document
router
  .route("/documents")
  .get(isAuth, isAuthAdmin, AuthController.getAllUserDocuments)
  .all(methodNotAllowed);

router
  .route("/documents/:documentId/verify")
  .patch(isAuth, isAuthAdmin, AuthController.verifyUserDocument)
  .all(methodNotAllowed);

router
  .route("/documents/:documentId/reject")
  .patch(isAuth, isAuthAdmin, AuthController.rejectUserDocument)
  .all(methodNotAllowed);

router
  .route("/documents/:userId")
  .get(isAuth, isAuthAdmin, UserController.getUserDocuments)
  .all(methodNotAllowed);

//report

router
  .route("/reports")
  .get(isAuth, isAuthAdmin, ReportController.getReports)
  .all(methodNotAllowed);

router
  .route("/report/:reportedUser")
  .get(isAuth, isAuthAdmin, ReportController.getReport)
  .all(methodNotAllowed);

//tenant
router
  .route("/tenants")
  .get(isAuth, isAuthAdmin, UserController.getTenantsForAdmin)
  .all(methodNotAllowed);

router
  .route("/tenant/:tenantId")
  .get(isAuth, isAuthAdmin, UserController.getTenantForAdmin)
  .all(methodNotAllowed);

//booking

router
  .route("/bookings/user/:userId")
  .get(isAuth, isAuthAdmin, BookingController.getTenantBookingsByAdmin)
  .all(methodNotAllowed);

router
  .route("/bookings/:landlordId/stats")
  .get(isAuth, isAuthAdmin, BookingController.getLandlordStats)
  .all(methodNotAllowed);
router
  .route("/bookings/tenant/:tenantId/stats")
  .get(isAuth, isAuthAdmin, BookingController.getTenantStats)
  .all(methodNotAllowed);

//landlord

router
  .route("/landlords")
  .get(isAuth, isAuthAdmin, UserController.getLandlordsForAdmin)
  .all(methodNotAllowed);

router
  .route("/landlord/:landlordId")
  .get(isAuth, isAuthAdmin, UserController.getLandlordForAdmin)
  .all(methodNotAllowed);

export default router;
