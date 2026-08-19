import { helpService } from "./help.service.js";

export async function listHelpArticles(req, res, next) {
  try {
    res.json(await helpService.list(req.user, req.query));
  } catch (error) {
    next(error);
  }
}

export async function listHelpCategories(req, res, next) {
  try {
    res.json(await helpService.categories(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getContextualHelp(req, res, next) {
  try {
    res.json(await helpService.context(req.user, req.query));
  } catch (error) {
    next(error);
  }
}

export async function getHelpArticle(req, res, next) {
  try {
    res.json(await helpService.detail(req.user, req.params.slug));
  } catch (error) {
    next(error);
  }
}

export async function createHelpArticle(req, res, next) {
  try {
    res.status(201).json(await helpService.create(req.user, req.body));
  } catch (error) {
    next(error);
  }
}

export async function updateHelpArticle(req, res, next) {
  try {
    res.json(await helpService.update(req.user, req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}

export async function publishHelpArticle(req, res, next) {
  try {
    res.json(await helpService.publish(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function archiveHelpArticle(req, res, next) {
  try {
    res.json(await helpService.archive(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}
