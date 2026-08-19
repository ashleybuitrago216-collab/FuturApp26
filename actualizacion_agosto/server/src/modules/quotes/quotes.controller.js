import { quotesService } from "./quotes.service.js";

export async function createQuote(req, res, next) {
  try {
    res.status(201).json(await quotesService.create(req.user, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function listQuotes(req, res, next) {
  try {
    res.json(await quotesService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getQuoteById(req, res, next) {
  try {
    res.json(await quotesService.getById(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function approveQuote(req, res, next) {
  try {
    res.json(await quotesService.approve(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function rejectQuote(req, res, next) {
  try {
    res.json(await quotesService.reject(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}
