import { paymentsService } from "./payments.service.js";

export async function getPaymentsStatus(req, res, next) {
  try {
    res.json(await paymentsService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getPaymentsSummary(req, res, next) {
  try {
    res.json(await paymentsService.summary(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getPaymentById(req, res, next) {
  try {
    res.json(await paymentsService.getById(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function initiatePayment(req, res, next) {
  try {
    res.json(await paymentsService.initiate(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function confirmTechnicianPayment(req, res, next) {
  try {
    res.json(await paymentsService.confirmTechnician(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}
