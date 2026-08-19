import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || "http://localhost:4000/api";
const PASSWORD = "Password123!";
const PREFIX = "PRUEBA_CS";

const shouldStartServer = process.argv.includes("--start-server");
let serverProcess = null;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function addResult(results, id, test, resultadoInicial, correccionAplicada, passed, details = {}) {
  const result = {
    id,
    test,
    resultadoInicial,
    correccionAplicada,
    resultadoFinal: passed ? "PASS" : "FAIL",
    ...details,
  };
  results.push(result);
  console.log(`${result.resultadoFinal} ${id} - ${test}`);
  if (!passed) console.log(JSON.stringify(result, null, 2));
}

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  return { status: response.status, payload };
}

async function startServerIfNeeded() {
  if (!shouldStartServer) return;
  try {
    const health = await request("/health");
    if (health.status === 200) {
      console.log("API already running; reusing current server.");
      return;
    }
  } catch {
    // Start a local API below.
  }
  serverProcess = spawn("node", ["src/server.js"], {
    cwd: new URL("../", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", chunk => process.stdout.write(`[api] ${chunk}`));
  serverProcess.stderr.on("data", chunk => process.stderr.write(`[api] ${chunk}`));
  await wait(2500);
}

async function roleByName(nombreRol) {
  return prisma.rol.upsert({
    where: { nombreRol },
    update: {},
    create: { nombreRol },
  });
}

async function ensureCatalogs() {
  const [adminRole, userRole, techRole, advisorRole] = await Promise.all([
    roleByName("Administrador"),
    roleByName("Usuario"),
    roleByName("Tecnico"),
    roleByName("Asesor"),
  ]);
  const area = await prisma.areaEspecialidad.upsert({
    where: { nombreAreaEspecialidad: `${PREFIX}_Area` },
    update: {},
    create: { nombreAreaEspecialidad: `${PREFIX}_Area` },
  });
  const estadoPendiente = await prisma.estado.upsert({
    where: { nombreEstado: "Pendiente" },
    update: {},
    create: { nombreEstado: "Pendiente" },
  });
  const estadoCancelado = await prisma.estado.upsert({
    where: { nombreEstado: "Cancelado" },
    update: {},
    create: { nombreEstado: "Cancelado" },
  });
  const prioridad = await prisma.prioridad.upsert({
    where: { nombrePrioridad: "Media" },
    update: {},
    create: { nombrePrioridad: "Media" },
  });
  const tipoServicio = await prisma.tipoServicio.findFirst({
    where: { nombreServicio: { notIn: ["Asesoria", "Asesoría", "Asesorias", "Asesorías"] } },
    orderBy: { idTipoServicio: "asc" },
  }) || await prisma.tipoServicio.create({
    data: {
      nombreServicio: `${PREFIX}_Servicio tecnico`,
      descripcionServicio: "Servicio tecnico de prueba",
    },
  });
  await prisma.estadoPago.findFirst({
    where: { nombreEstadoPago: "Pendiente" },
    orderBy: { idEstadoPago: "asc" },
  }) || await prisma.estadoPago.create({ data: { nombreEstadoPago: "Pendiente" } });
  await prisma.medioPago.upsert({
    where: { nombreMedioPago: "Efectivo" },
    update: {},
    create: { nombreMedioPago: "Efectivo" },
  });

  return { adminRole, userRole, techRole, advisorRole, area, estadoPendiente, estadoCancelado, prioridad, tipoServicio };
}

async function ensureUser({ email, roleId, areaId = null }) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  return prisma.usuario.upsert({
    where: { correo: email },
    update: {
      contrasenaHash: hash,
      idRol: roleId,
      idAreaEspecialidad: areaId,
      activo: true,
    },
    create: {
      nombre: PREFIX,
      apellido: email.split("@")[0],
      correo: email,
      contrasenaHash: hash,
      idRol: roleId,
      idAreaEspecialidad: areaId,
      activo: true,
    },
  });
}

async function login(email) {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  if (response.status !== 200) throw new Error(`Login failed for ${email}: ${response.status}`);
  return response.payload.token;
}

async function createService({ userId, tipoServicioId, prioridadId, estadoId, label }) {
  return prisma.solicitudServicio.create({
    data: {
      idUsuario: userId,
      idTipoServicio: tipoServicioId,
      idPrioridad: prioridadId,
      idEstado: estadoId,
      descripcionProblema: `${PREFIX}_${label}_${Date.now()}`,
    },
  });
}

async function assignTechnician({ serviceId, technicianId, adminToken }) {
  return request(`/services/${serviceId}`, {
    token: adminToken,
    method: "PATCH",
    body: { technicianId },
  });
}

async function quoteAndApprove({ serviceId, technicianToken, userToken, amount = 120000, ids }) {
  const quoteCreate = await request("/quotes", {
    token: technicianToken,
    method: "POST",
    body: { serviceId, monto: amount, descripcion: "Incluye diagnostico, reparacion y pruebas." },
  });
  const quoteId = quoteCreate.payload?.id || quoteCreate.payload?.quoteId || quoteCreate.payload?.idCotizacion;
  if (quoteId) ids.quotes.push(quoteId);

  const quoteApprove = await request(`/quotes/${quoteId}/approve`, {
    token: userToken,
    method: "POST",
  });
  const quote = await prisma.cotizacion.findUnique({
    where: { idCotizacion: Number(quoteId) },
    include: { pago: true },
  });
  if (quote?.idPago) ids.payments.push(quote.idPago);

  return { quoteCreate, quoteApprove, quote };
}

async function quoteAndReject({ serviceId, technicianToken, userToken, ids }) {
  const quoteCreate = await request("/quotes", {
    token: technicianToken,
    method: "POST",
    body: { serviceId, monto: 90000, descripcion: "Cotizacion para rechazo controlado." },
  });
  const quoteId = quoteCreate.payload?.id || quoteCreate.payload?.quoteId || quoteCreate.payload?.idCotizacion;
  if (quoteId) ids.quotes.push(quoteId);
  const quoteReject = await request(`/quotes/${quoteId}/reject`, {
    token: userToken,
    method: "POST",
    body: { motivo: "Prueba controlada de rechazo." },
  });
  return { quoteCreate, quoteReject };
}

async function paymentCountForService(serviceId) {
  return prisma.pago.count({
    where: { cita: { idSolicitudServicio: Number(serviceId) } },
  });
}

async function createAssignedService({ catalogs, usuario, tecnico, adminToken, ids, label, estadoId }) {
  const service = await createService({
    userId: usuario.idUsuario,
    tipoServicioId: catalogs.tipoServicio.idTipoServicio,
    prioridadId: catalogs.prioridad.idPrioridad,
    estadoId,
    label,
  });
  ids.services.push(service.idSolicitudServicio);
  await assignTechnician({ serviceId: service.idSolicitudServicio, technicianId: tecnico.idUsuario, adminToken });
  const cita = await prisma.cita.findUnique({ where: { idSolicitudServicio: service.idSolicitudServicio } });
  if (cita?.idCita) ids.appointments.push(cita.idCita);
  return service;
}

async function main() {
  const results = [];
  const ids = { users: {}, services: [], quotes: [], payments: [], appointments: [], notifications: [] };

  await startServerIfNeeded();

  const catalogs = await ensureCatalogs();
  const admin = await ensureUser({ email: "prueba_cs_admin@futurapp.local", roleId: catalogs.adminRole.idRol });
  const usuario = await ensureUser({ email: "prueba_cs_usuario@futurapp.local", roleId: catalogs.userRole.idRol });
  const tecnico = await ensureUser({ email: "prueba_cs_tecnico@futurapp.local", roleId: catalogs.techRole.idRol, areaId: catalogs.area.idAreaEspecialidad });
  const tecnicoAjeno = await ensureUser({ email: "prueba_cs_tecnico_ajeno@futurapp.local", roleId: catalogs.techRole.idRol, areaId: catalogs.area.idAreaEspecialidad });
  const asesor = await ensureUser({ email: "prueba_cs_asesor@futurapp.local", roleId: catalogs.advisorRole.idRol });

  ids.users = {
    admin: admin.idUsuario,
    usuario: usuario.idUsuario,
    tecnico: tecnico.idUsuario,
    tecnicoAjeno: tecnicoAjeno.idUsuario,
    asesor: asesor.idUsuario,
  };

  const tokens = {
    admin: await login(admin.correo),
    usuario: await login(usuario.correo),
    tecnico: await login(tecnico.correo),
    tecnicoAjeno: await login(tecnicoAjeno.correo),
    asesor: await login(asesor.correo),
  };

  const service = await createAssignedService({
    catalogs,
    usuario,
    tecnico,
    adminToken: tokens.admin,
    ids,
    label: "CS_MAIN",
    estadoId: catalogs.estadoPendiente.idEstado,
  });

  const technicianServices = await request("/services", { token: tokens.tecnico });
  addResult(results, "CS01", "Tecnico ve servicio asignado", "Tecnico listaba sus servicios asignados", "Se mantiene filtro por cita.id_usuario_tecnico", technicianServices.status === 200 && technicianServices.payload.some(item => item.id === service.idSolicitudServicio), {
    serviceId: service.idSolicitudServicio,
  });

  const { quote, quoteApprove } = await quoteAndApprove({
    serviceId: service.idSolicitudServicio,
    technicianToken: tokens.tecnico,
    userToken: tokens.usuario,
    ids,
  });
  const paymentId = quote?.idPago;
  const payBeforeComplete = await request(`/payments/${paymentId}/initiate`, {
    token: tokens.usuario,
    method: "POST",
    body: { method: "Efectivo" },
  });
  addResult(results, "CS09", "Usuario no paga antes de completar", "Pago pendiente podia iniciarse solo por existir", "payments.initiate valida servicio completado", quoteApprove.status === 200 && payBeforeComplete.status === 400, {
    paymentId,
    status: payBeforeComplete.status,
    message: payBeforeComplete.payload?.message,
  });

  const completeForeign = await request(`/services/${service.idSolicitudServicio}/complete`, {
    token: tokens.tecnicoAjeno,
    method: "PATCH",
  });
  addResult(results, "CS03", "Tecnico ajeno no completa", "No existia endpoint de completar", "Endpoint valida cita asignada al tecnico autenticado", completeForeign.status === 403, { status: completeForeign.status });

  const completeUser = await request(`/services/${service.idSolicitudServicio}/complete`, {
    token: tokens.usuario,
    method: "PATCH",
  });
  addResult(results, "CS04", "Usuario no completa", "No existia endpoint de completar", "Endpoint permite solo rol tecnico", completeUser.status === 403, { status: completeUser.status });

  const completeAdmin = await request(`/services/${service.idSolicitudServicio}/complete`, {
    token: tokens.admin,
    method: "PATCH",
  });
  addResult(results, "CS05", "Admin no completa", "Admin podia cambiar estados desde edicion general", "Endpoint exclusivo de tecnico y update bloquea estado final", completeAdmin.status === 403, { status: completeAdmin.status });

  const completeAdvisor = await request(`/services/${service.idSolicitudServicio}/complete`, {
    token: tokens.asesor,
    method: "PATCH",
  });
  addResult(results, "CS06", "Asesor no completa", "No existia endpoint de completar", "Endpoint permite solo rol tecnico", completeAdvisor.status === 403, { status: completeAdvisor.status });

  const countBeforeComplete = await paymentCountForService(service.idSolicitudServicio);
  const completeValid = await request(`/services/${service.idSolicitudServicio}/complete`, {
    token: tokens.tecnico,
    method: "PATCH",
    body: { observacionFinal: "Servicio realizado correctamente." },
  });
  const serviceAfterComplete = await prisma.solicitudServicio.findUnique({
    where: { idSolicitudServicio: service.idSolicitudServicio },
    include: { estado: true },
  });
  const countAfterComplete = await paymentCountForService(service.idSolicitudServicio);
  addResult(results, "CS02", "Tecnico completa servicio valido", "No existia accion de completar servicio", "PATCH /api/services/:id/complete cambia a Finalizado/Completado", completeValid.status === 200 && ["Finalizado", "Completado"].includes(serviceAfterComplete.estado?.nombreEstado), {
    status: completeValid.status,
    serviceState: serviceAfterComplete.estado?.nombreEstado,
  });
  addResult(results, "CS11", "No se duplica pago al completar", "Completar pudo haber creado pago duplicado", "Completar solo habilita pago existente", countBeforeComplete === countAfterComplete && countAfterComplete === 1, {
    before: countBeforeComplete,
    after: countAfterComplete,
  });

  const completeAgain = await request(`/services/${service.idSolicitudServicio}/complete`, {
    token: tokens.tecnico,
    method: "PATCH",
  });
  addResult(results, "CS08", "No completar ya completado", "No existia validacion previa", "Endpoint devuelve 409 si ya esta finalizado", completeAgain.status === 409, { status: completeAgain.status });

  const payAfterComplete = await request(`/payments/${paymentId}/initiate`, {
    token: tokens.usuario,
    method: "POST",
    body: { method: "Efectivo" },
  });
  addResult(results, "CS10", "Usuario paga despues de completar", "Pago estaba bloqueado antes de completar", "Servicio completado habilita initiate", payAfterComplete.status === 200 && payAfterComplete.payload?.estado === "Pagado", {
    status: payAfterComplete.status,
    paymentState: payAfterComplete.payload?.estado,
  });

  const confirmPayment = await request(`/payments/${paymentId}/confirm-technician`, {
    token: tokens.tecnico,
    method: "POST",
    body: { method: "Efectivo" },
  });
  addResult(results, "CS14", "Tecnico confirma pago despues de pago valido", "Confirmacion existente depende de pago Pagado", "No se altero confirmacion tecnica", confirmPayment.status === 200 && ["PAYMENT_CONFIRMED", "PAYMENT_CONFIRMED_WITH_METHOD_MISMATCH"].includes(confirmPayment.payload?.code), {
    status: confirmPayment.status,
    code: confirmPayment.payload?.code,
  });

  const adminServicesAfterComplete = await request("/services", { token: tokens.admin });
  addResult(results, "CS15", "Admin ve estado completado", "Admin debia consultar estado actualizado", "Mapper expone Finalizado como Completado", adminServicesAfterComplete.status === 200 && adminServicesAfterComplete.payload.some(item => item.id === service.idSolicitudServicio && item.estado === "Completado"), {
    serviceId: service.idSolicitudServicio,
  });

  const canceledService = await createAssignedService({
    catalogs,
    usuario,
    tecnico,
    adminToken: tokens.admin,
    ids,
    label: "CS_CANCEL",
    estadoId: catalogs.estadoPendiente.idEstado,
  });
  await request(`/services/${canceledService.idSolicitudServicio}/cancel`, {
    token: tokens.admin,
    method: "PATCH",
  });
  const completeCanceled = await request(`/services/${canceledService.idSolicitudServicio}/complete`, {
    token: tokens.tecnico,
    method: "PATCH",
  });
  addResult(results, "CS07", "No completar cancelado", "No existia validacion previa", "Endpoint devuelve 409 si esta cancelado", completeCanceled.status === 409, { status: completeCanceled.status });

  const rejectedQuoteService = await createAssignedService({
    catalogs,
    usuario,
    tecnico,
    adminToken: tokens.admin,
    ids,
    label: "CS_REJECTED",
    estadoId: catalogs.estadoPendiente.idEstado,
  });
  const rejectedFlow = await quoteAndReject({
    serviceId: rejectedQuoteService.idSolicitudServicio,
    technicianToken: tokens.tecnico,
    userToken: tokens.usuario,
    ids,
  });
  await request(`/services/${rejectedQuoteService.idSolicitudServicio}/complete`, {
    token: tokens.tecnico,
    method: "PATCH",
  });
  const rejectedPaymentCount = await paymentCountForService(rejectedQuoteService.idSolicitudServicio);
  addResult(results, "CS12", "Cotizacion rechazada no permite pago aunque servicio este completado", "Una cotizacion rechazada no debe crear pago", "Reject mantiene pago inexistente", rejectedFlow.quoteReject.status === 200 && rejectedPaymentCount === 0, {
    serviceId: rejectedQuoteService.idSolicitudServicio,
    paymentCount: rejectedPaymentCount,
  });

  const noQuoteService = await createAssignedService({
    catalogs,
    usuario,
    tecnico,
    adminToken: tokens.admin,
    ids,
    label: "CS_NO_QUOTE",
    estadoId: catalogs.estadoPendiente.idEstado,
  });
  await request(`/services/${noQuoteService.idSolicitudServicio}/complete`, {
    token: tokens.tecnico,
    method: "PATCH",
  });
  const noQuotePaymentCount = await paymentCountForService(noQuoteService.idSolicitudServicio);
  addResult(results, "CS13", "Servicio sin cotizacion aprobada no permite pago", "Sin cotizacion no debe existir pago pagable", "No se genera pago al completar si no existe cotizacion aprobada", noQuotePaymentCount === 0, {
    serviceId: noQuoteService.idSolicitudServicio,
    paymentCount: noQuotePaymentCount,
  });

  const advisoryCreate = await request("/advisories", {
    token: tokens.usuario,
    method: "POST",
    body: {
      descripcionInicial: `${PREFIX} asesoria para servicio completable`,
      tipoDispositivo: "Computador",
      fechaContacto: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      horaContacto: "10:30",
    },
  });
  const advisoryId = advisoryCreate.payload?.id || advisoryCreate.payload?.advisory?.id || advisoryCreate.payload?.asesoria?.id;
  if (advisoryId) ids.advisories = [advisoryId];
  await request(`/advisories/${advisoryId}/assign`, {
    token: tokens.admin,
    method: "PATCH",
    body: { asesorId: asesor.idUsuario },
  });
  const advisoryResolve = await request(`/advisories/${advisoryId}/resolve`, {
    token: tokens.asesor,
    method: "PATCH",
    body: {
      tipoServicioId: catalogs.tipoServicio.idTipoServicio,
      descripcionServicioFinal: `${PREFIX} descripcion tecnica final para completar desde asesorias`,
    },
  });
  const generatedServiceId = advisoryResolve.payload?.service?.id || advisoryResolve.payload?.service?.serviceId || advisoryResolve.payload?.advisory?.serviceId || advisoryResolve.payload?.advisory?.solicitudServicioId;
  if (generatedServiceId) ids.services.push(generatedServiceId);
  await assignTechnician({ serviceId: generatedServiceId, technicianId: tecnico.idUsuario, adminToken: tokens.admin });
  const advisoryGeneratedComplete = await request(`/services/${generatedServiceId}/complete`, {
    token: tokens.tecnico,
    method: "PATCH",
  });
  addResult(results, "CS16", "No regresion de asesorias", "Servicio generado desde asesoria debe poder completarse", "Completar opera tambien sobre servicios originados en asesorias", advisoryResolve.status === 200 && advisoryGeneratedComplete.status === 200, {
    advisoryId,
    generatedServiceId,
    resolveStatus: advisoryResolve.status,
    completeStatus: advisoryGeneratedComplete.status,
  });

  const quoteRegressionService = await createAssignedService({
    catalogs,
    usuario,
    tecnico,
    adminToken: tokens.admin,
    ids,
    label: "CS_QUOTES",
    estadoId: catalogs.estadoPendiente.idEstado,
  });
  const quoteRegression = await quoteAndApprove({
    serviceId: quoteRegressionService.idSolicitudServicio,
    technicianToken: tokens.tecnico,
    userToken: tokens.usuario,
    ids,
    amount: 130000,
  });
  addResult(results, "CS17", "No regresion de cotizaciones", "Cotizar y aprobar debian seguir funcionando", "Quotes mantiene creacion y aprobacion", quoteRegression.quoteCreate.status === 201 && quoteRegression.quoteApprove.status === 200 && Boolean(quoteRegression.quote?.idPago), {
    serviceId: quoteRegressionService.idSolicitudServicio,
    quoteId: quoteRegression.quote?.idCotizacion,
    paymentId: quoteRegression.quote?.idPago,
  });

  const health = await request("/health");
  const servicesEndpoint = await request("/services", { token: tokens.admin });
  const quotesEndpoint = await request("/quotes", { token: tokens.admin });
  const paymentsEndpoint = await request("/payments", { token: tokens.admin });
  const notificationsEndpoint = await request("/notifications", { token: tokens.admin });
  const advisoriesEndpoint = await request("/advisories", { token: tokens.admin });
  addResult(results, "CS18", "No regresion general", "Validar endpoints principales", "Auth, services, quotes, payments, notifications y advisories responden", [health, servicesEndpoint, quotesEndpoint, paymentsEndpoint, notificationsEndpoint, advisoriesEndpoint].every(item => item.status === 200), {
    statuses: {
      health: health.status,
      services: servicesEndpoint.status,
      quotes: quotesEndpoint.status,
      payments: paymentsEndpoint.status,
      notifications: notificationsEndpoint.status,
      advisories: advisoriesEndpoint.status,
    },
  });

  const failed = results.filter(result => result.resultadoFinal !== "PASS");
  console.log("\n=== TECHNICIAN COMPLETE SERVICE PAYMENT GATE REPORT ===");
  console.table(results.map(({ id, test, resultadoInicial, correccionAplicada, resultadoFinal }) => ({
    id,
    test,
    resultadoInicial,
    correccionAplicada,
    resultadoFinal,
  })));
  console.log("IDs creados:", JSON.stringify(ids, null, 2));

  if (failed.length) {
    process.exitCode = 1;
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (serverProcess) serverProcess.kill();
    await prisma.$disconnect();
  });
