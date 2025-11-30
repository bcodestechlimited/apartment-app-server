import express from "express";
import { WalletController } from "./wallet.controller.js";
import { isAuth } from "@/middleware/auth.js";
import methodNotAllowed from "@/middleware/methodNotAllowed.js";

const router = express.Router();

router
  .route("/")
  .get(isAuth, WalletController.getUserWallet)
  .put(
    isAuth,
    // walletUpdateValidator,
    WalletController.updateUserWallet
  )
  .post(
    isAuth,
    // walletDepositValidator,
    WalletController.topUpWallet
  )
  .all(methodNotAllowed);

router
  .route("/verify-payment/:reference")
  .get(
    isAuth,
    // walletDepositValidator,
    WalletController.verifyTopUpWallet
  )
  .all(methodNotAllowed);
router
  .route("/withdraw")
  .post(
    isAuth,
    //  walletWithdrawValidator,
    WalletController.withdrawFromWallet
  )
  .all(methodNotAllowed);

router
  .route("/banks")
  .get(isAuth, WalletController.getAllBanks)
  .all(methodNotAllowed);
router
  .route("/verify-account-number")
  .get(WalletController.verifyAccountNumber)
  .all(methodNotAllowed);

export default router;
