import { appointmentsService } from "./appointments.service.js";

export async function getAppointmentsStatus(req, res, next) {
  try {
    res.json(await appointmentsService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function scheduleAppointment(req, res, next) {
  try {
    res.json(await appointmentsService.schedule(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    res.json(await appointmentsService.updateStatus(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}
