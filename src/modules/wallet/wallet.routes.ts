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

export default router;
