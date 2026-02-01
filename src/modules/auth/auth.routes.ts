import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { AuthController } from "./auth.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { authSchemas } from "./auth.schema.js";

const router = express.Router();

router
  .route("/")
  .get(isAuth, AuthController.getUser)
  .patch(
    isAuth,
    validateBody(authSchemas.update),
    authSchemas.validateFiles,
    AuthController.updateUser,
  )
  .all(methodNotAllowed);

router
  .route("/signup")
  .post(validateBody(authSchemas.register), AuthController.register)
  .all(methodNotAllowed);

router
  .route("/signin")
  .post(validateBody(authSchemas.login), AuthController.login)
  .all(methodNotAllowed);

router
  .route("/complete-onboarding")
  .post(isAuth, AuthController.completeOnboarding)
  .all(methodNotAllowed);

router
  .route("/logout")
  .get(isAuth, AuthController.logout)
  .all(methodNotAllowed);

router
  .route("/send-otp")
  .post(validateBody(authSchemas.sendOTP), AuthController.sendOTP)
  .all(methodNotAllowed);

router
  .route("/verify-otp")
  .post(validateBody(authSchemas.verifyOTP), AuthController.verifyOTP)
  .all(methodNotAllowed);

router
  .route("/forgot-password")
  .post(validateBody(authSchemas.forgotPassword), AuthController.forgotPassword)
  .all(methodNotAllowed);

router
  .route("/reset-password")
  .post(validateBody(authSchemas.resetPassword), AuthController.resetPassword)
  .all(methodNotAllowed);

router
  .route("/google")
  .get(AuthController.generateGoogleLoginLink)
  .all(methodNotAllowed);

router
  .route("/google/callback")
  .get(AuthController.googleCallback)
  .all(methodNotAllowed);

// Profile
router
  .route("/profile/personal-info")
  .get(isAuth, AuthController.getPersonalInfo)
  .patch(
    isAuth,
    validateBody(authSchemas.updatePersonalInfo),
    AuthController.updatePersonalInfo,
  )
  .all(methodNotAllowed);

router
  .route("/profile/employment")
  .get(isAuth, AuthController.getUserEmployment)
  .patch(
    isAuth,
    validateBody(authSchemas.updateUserEmployment),
    AuthController.updateUserEmployment,
  )
  .all(methodNotAllowed);

router
  .route("/profile/documents")
  .get(isAuth, AuthController.getUserDocuments)
  .post(isAuth, authSchemas.validateDocument, AuthController.uploadUserDocument)
  .all(methodNotAllowed);

router
  .route("/profile/next-of-kin")
  .get(isAuth, AuthController.getUserNextOfKin)
  .patch(
    isAuth,
    validateBody(authSchemas.updateNextOfKin),
    AuthController.updateUserNextOfKin,
  )
  .all(methodNotAllowed);

router
  .route("/profile/guarantor")
  .get(isAuth, AuthController.getUserGuarantor)
  .patch(
    isAuth,
    validateBody(authSchemas.updateGuarantor),
    AuthController.updateUserGuarantor,
  )
  .all(methodNotAllowed);

// router
//   .route("/profile/notification")
//   .get(isAuth, AuthController.getUserGuarantor)
//   .patch(
//     isAuth,
//     validateBody(authSchemas.updateNextOfKin),
//     AuthController.updateUserGuarantor
//   )
//   .all(methodNotAllowed);

export default router;
