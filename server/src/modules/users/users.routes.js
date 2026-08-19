import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import {
  getMyProfile,
  getTechniciansStatus,
  getUserCatalogs,
  getUsersStatus,
  updateMyProfile,
  updateUserFromAdmin,
} from "./users.controller.js";

const router = Router();

router.get("/", verifyToken, getUsersStatus);
router.get("/technicians", verifyToken, getTechniciansStatus);
router.get("/catalogs", verifyToken, getUserCatalogs);
router.get("/me", verifyToken, getMyProfile);
router.patch("/me", verifyToken, updateMyProfile);
router.patch("/:id/admin", verifyToken, updateUserFromAdmin);

export default router;
