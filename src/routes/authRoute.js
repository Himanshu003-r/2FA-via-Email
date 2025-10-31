import express, { Router } from "express";
import {
  isAuthenticated,
  resetPassword,
  sendResetOtp,
  sendVerifyOtp,
  userLogin,
  userLogout,
  userRegister,
  verifyEmail,
} from "../../controllers/authController.js";
import { verifyJWT } from "../../middleware/authMiddleware.js";
const router = Router();

router.post("/register", userRegister);
router.post("/login",userLogin)
router.get("/logout", userLogout)
router.post("/send-verify-otp", verifyJWT, sendVerifyOtp)
router.post("/verify-account",verifyJWT, verifyEmail)
router.post("/is-auth",verifyJWT, isAuthenticated)
router.post("/reset-password",verifyJWT,resetPassword)
router.post("/reset-otp",sendResetOtp)
export default router;
