import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { isAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { authSchemas } from "./auth.schema.js";
import { authController } from "./auth.controller.js";

const router = express.Router();

router
  .route("/")
  .get(isAuth, authController.getUser)
  .patch(
    isAuth,
    validateBody(authSchemas.update),
    authSchemas.validateFiles,
    authController.updateUser,
  )
  .all(methodNotAllowed);

router
  .route("/signup")
  .post(validateBody(authSchemas.register), authController.register)
  .all(methodNotAllowed);

router
  .route("/signin")
  .post(validateBody(authSchemas.login), authController.login)
  .all(methodNotAllowed);

router
  .route("/complete-onboarding")
  .post(isAuth, authController.completeOnboarding)
  .all(methodNotAllowed);

router
  .route("/logout")
  .get(isAuth, authController.logout)
  .all(methodNotAllowed);

router
  .route("/send-otp")
  .post(validateBody(authSchemas.sendOTP), authController.sendOTP)
  .all(methodNotAllowed);

router
  .route("/verify-otp")
  .post(validateBody(authSchemas.verifyOTP), authController.verifyOTP)
  .all(methodNotAllowed);

router
  .route("/forgot-password")
  .post(validateBody(authSchemas.forgotPassword), authController.forgotPassword)
  .all(methodNotAllowed);

router
  .route("/reset-password")
  .post(validateBody(authSchemas.resetPassword), authController.resetPassword)
  .all(methodNotAllowed);

router
  .route("/google")
  .get(authController.generateGoogleLoginLink)
  .all(methodNotAllowed);

router
  .route("/google/callback")
  .get(authController.googleCallback)
  .all(methodNotAllowed);

// Profile
router
  .route("/profile/personal-info")
  .get(isAuth, authController.getPersonalInfo)
  .patch(
    isAuth,
    validateBody(authSchemas.updatePersonalInfo),
    authController.updatePersonalInfo,
  )
  .all(methodNotAllowed);

router
  .route("/profile/employment")
  .get(isAuth, authController.getUserEmployment)
  .patch(
    isAuth,
    validateBody(authSchemas.updateUserEmployment),
    authController.updateUserEmployment,
  )
  .all(methodNotAllowed);

router
  .route("/profile/documents")
  .get(isAuth, authController.getUserDocuments)
  .post(isAuth, authController.uploadUserDocument)
  .all(methodNotAllowed);

router
  .route("/profile/next-of-kin")
  .get(isAuth, authController.getUserNextOfKin)
  .patch(
    isAuth,
    validateBody(authSchemas.updateNextOfKin),
    authController.updateUserNextOfKin,
  )
  .all(methodNotAllowed);

router
  .route("/profile/guarantor")
  .get(isAuth, authController.getUserGuarantor)
  .patch(
    isAuth,
    validateBody(authSchemas.updateGuarantor),
    authController.updateUserGuarantor,
  )
  .all(methodNotAllowed);

export default router;
