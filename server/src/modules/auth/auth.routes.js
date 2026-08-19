import { Router } from "express";
import { forgotPassword, getAuthStatus, login, logout, me, register, resetPassword } from "./auth.controller.js";
import { verifyToken } from "../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getAuthStatus);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", verifyToken, me);
router.post("/logout", logout);

export default router;
