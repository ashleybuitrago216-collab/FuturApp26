import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import {
  archiveHelpArticle,
  createHelpArticle,
  getContextualHelp,
  getHelpArticle,
  listHelpArticles,
  listHelpCategories,
  publishHelpArticle,
  updateHelpArticle,
} from "./help.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", listHelpArticles);
router.get("/categories", listHelpCategories);
router.get("/context", getContextualHelp);
router.post("/", createHelpArticle);
router.patch("/:id", updateHelpArticle);
router.patch("/:id/publish", publishHelpArticle);
router.patch("/:id/archive", archiveHelpArticle);
router.get("/:slug", getHelpArticle);

export default router;
