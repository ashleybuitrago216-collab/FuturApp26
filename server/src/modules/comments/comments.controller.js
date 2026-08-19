import { commentsService } from "./comments.service.js";

export async function getCommentsStatus(req, res, next) {
  try {
    res.json(await commentsService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function createReview(req, res, next) {
  try {
    res.status(201).json(await commentsService.create(req.user, req.body));
  } catch (error) {
    next(error);
  }
}

export async function respondReview(req, res, next) {
  try {
    res.json(await commentsService.respond(req.user, req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}
