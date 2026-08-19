import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import { approveQuote, createQuote, getQuoteById, listQuotes, rejectQuote } from "./quotes.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", listQuotes);
router.post("/", createQuote);
router.get("/:id", getQuoteById);
router.post("/:id/approve", approveQuote);
router.post("/:id/reject", rejectQuote);

export default router;
