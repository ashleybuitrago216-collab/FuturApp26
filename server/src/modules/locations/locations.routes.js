import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import {
  createTechnicianLocation,
  getLocationsStatus,
  getServiceRoute,
  getServiceLocationStatus,
  getTechnicianLocationHistory,
  upsertServiceLocation,
} from "./locations.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", getLocationsStatus);
router.get("/services/:id", getServiceLocationStatus);
router.get("/services/:id/route", getServiceRoute);
router.put("/services/:id/service-location", upsertServiceLocation);
router.post("/services/:id/technician-location", createTechnicianLocation);
router.get("/services/:id/technician-history", getTechnicianLocationHistory);

export default router;
