import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || "http://localhost:4000/api";
const PASSWORD = "Password123!";
const PREFIX = "PRUEBA_QF";

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
  const estado = await prisma.estado.upsert({
    where: { nombreEstado: "Pendiente" },
    update: {},
    create: { nombreEstado: "Pendiente" },
  });
  const prioridad = await prisma.prioridad.upsert({
    where: { nombrePrioridad: "Media" },
    update: {},
    create: { nombrePrioridad: "Media" },
  });
  const tipoServicio = await prisma.tipoServicio.findFirst({ orderBy: { idTipoServicio: "asc" } })
    || prisma.tipoServicio.create({ data: { nombreServicio: `${PREFIX}_Servicio`, descripcionServicio: "Servicio de prueba" } });
  const estadoPagoPendiente = await prisma.estadoPago.findFirst({
    where: { nombreEstadoPago: "Pendiente" },
    orderBy: { idEstadoPago: "asc" },
  }) || prisma.estadoPago.create({ data: { nombreEstadoPago: "Pendiente" } });
  const medioPago = await prisma.medioPago.upsert({
    where: { nombreMedioPago: "Efectivo" },
    update: {},
    create: { nombreMedioPago: "Efectivo" },
  });

  return { adminRole, userRole, techRole, advisorRole, area, estado, prioridad, tipoServicio, estadoPagoPendiente, medioPago };
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
      descripcionProblema: `${PREFIX}_${label}`,
    },
  });
}

async function countPaymentsForService(serviceId) {
  return prisma.pago.count({
    where: { cita: { idSolicitudServicio: serviceId } },
  });
}

async function latestQuoteForService(serviceId) {
  return prisma.cotizacion.findUnique({
    where: { idSolicitudServicio: serviceId },
    include: { pago: true },
  });
}

async function main() {
  const results = [];
  const ids = { users: {}, services: [], quotes: [], payments: [], appointments: [] };

  await startServerIfNeeded();

  const catalogs = await ensureCatalogs();
  const admin = await ensureUser({ email: "prueba_qf_admin@futurapp.local", roleId: catalogs.adminRole.idRol });
  const usuario = await ensureUser({ email: "prueba_qf_usuario@futurapp.local", roleId: catalogs.userRole.idRol });
  const tecnico = await ensureUser({ email: "prueba_qf_tecnico@futurapp.local", roleId: catalogs.techRole.idRol, areaId: catalogs.area.idAreaEspecialidad });
  const tecnicoAjeno = await ensureUser({ email: "prueba_qf_tecnico_ajeno@futurapp.local", roleId: catalogs.techRole.idRol, areaId: catalogs.area.idAreaEspecialidad });
  const asesor = await ensureUser({ email: "prueba_qf_asesor@futurapp.local", roleId: catalogs.advisorRole.idRol });

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

  const service = await createService({
    userId: usuario.idUsuario,
    tipoServicioId: catalogs.tipoServicio.idTipoServicio,
    prioridadId: catalogs.prioridad.idPrioridad,
    estadoId: catalogs.estado.idEstado,
    label: "QF01",
  });
  ids.services.push(service.idSolicitudServicio);

  const assign = await request(`/services/${service.idSolicitudServicio}`, {
    token: tokens.admin,
    method: "PATCH",
    body: { technicianId: tecnico.idUsuario },
  });
  const cita = await prisma.cita.findUnique({ where: { idSolicitudServicio: service.idSolicitudServicio } });
  ids.appointments.push(cita?.idCita);
  addResult(results, "QF01", "Admin asigna tecnico sin monto", "Admin ya no debe definir monto", "Asignacion conserva tecnico sin crear pago", assign.status === 200 && cita?.idUsuarioTecnico === tecnico.idUsuario && await countPaymentsForService(service.idSolicitudServicio) === 0, {
    status: assign.status,
    serviceId: service.idSolicitudServicio,
    citaId: cita?.idCita,
  });

  const quoteCreate = await request("/quotes", {
    token: tokens.tecnico,
    method: "POST",
    body: { serviceId: service.idSolicitudServicio, monto: 120000, descripcion: "Incluye diagnostico y reparacion." },
  });
  const quote = await latestQuoteForService(service.idSolicitudServicio);
  ids.quotes.push(quote?.idCotizacion);
  addResult(results, "QF02", "Tecnico crea cotizacion valida", "No existia flujo formal de cotizacion", "POST /quotes crea cotizacion Enviada", quoteCreate.status === 201 && quote?.estado === "Enviada", {
    status: quoteCreate.status,
    quoteId: quote?.idCotizacion,
  });

  const foreignTech = await request("/quotes", {
    token: tokens.tecnicoAjeno,
    method: "POST",
    body: { serviceId: service.idSolicitudServicio, monto: 130000 },
  });
  addResult(results, "QF03", "Tecnico ajeno no cotiza", "Riesgo de cotizar servicios ajenos", "Backend valida tecnico asignado", foreignTech.status === 403, { status: foreignTech.status });

  const adminQuote = await request("/quotes", {
    token: tokens.admin,
    method: "POST",
    body: { serviceId: service.idSolicitudServicio, monto: 130000 },
  });
  addResult(results, "QF04", "Admin no crea cotizacion", "Admin no debe definir monto", "POST /quotes solo tecnico", adminQuote.status === 403, { status: adminQuote.status });

  const userQuote = await request("/quotes", {
    token: tokens.usuario,
    method: "POST",
    body: { serviceId: service.idSolicitudServicio, monto: 130000 },
  });
  addResult(results, "QF05", "Usuario no crea cotizacion", "Usuario no define monto", "POST /quotes solo tecnico", userQuote.status === 403, { status: userQuote.status });

  const invalidAmount = await request("/quotes", {
    token: tokens.tecnico,
    method: "POST",
    body: { serviceId: service.idSolicitudServicio, monto: 0 },
  });
  addResult(results, "QF06", "Monto invalido", "Riesgo de monto 0 o invalido", "Se usa normalizacion de pagos", invalidAmount.status === 400, { status: invalidAmount.status });

  const userQuotes = await request("/quotes", { token: tokens.usuario });
  addResult(results, "QF07", "Usuario ve cotizacion", "Usuario no tenia bandeja de cotizaciones", "GET /quotes filtra por usuario cliente", userQuotes.status === 200 && userQuotes.payload.some(item => item.id === quote.idCotizacion), {
    status: userQuotes.status,
  });

  const approve = await request(`/quotes/${quote.idCotizacion}/approve`, {
    token: tokens.usuario,
    method: "POST",
  });
  const approvedQuote = await latestQuoteForService(service.idSolicitudServicio);
  ids.payments.push(approvedQuote?.idPago);
  addResult(results, "QF08", "Usuario aprueba cotizacion", "No existia aprobacion de usuario", "Approve cambia estado a Aprobada", approve.status === 200 && approvedQuote?.estado === "Aprobada", {
    status: approve.status,
  });

  const payment = await prisma.pago.findUnique({ where: { idPago: approvedQuote.idPago } });
  addResult(results, "QF09", "Al aprobar se crea pago pendiente", "Pago no debia existir antes de aprobar", "Transaccion crea pago y vincula id_pago", Boolean(payment) && Number(payment.monto) === 120000 && payment.idCita === cita.idCita, {
    paymentId: payment?.idPago,
    amount: payment ? Number(payment.monto) : null,
  });

  const duplicateApprove = await request(`/quotes/${quote.idCotizacion}/approve`, {
    token: tokens.usuario,
    method: "POST",
  });
  const paymentsAfterDuplicate = await countPaymentsForService(service.idSolicitudServicio);
  addResult(results, "QF10", "Aprobar dos veces no duplica pago", "Riesgo de doble click", "Estado procesado responde 409", duplicateApprove.status === 409 && paymentsAfterDuplicate === 1, {
    status: duplicateApprove.status,
    payments: paymentsAfterDuplicate,
  });

  const rejectService = await createService({
    userId: usuario.idUsuario,
    tipoServicioId: catalogs.tipoServicio.idTipoServicio,
    prioridadId: catalogs.prioridad.idPrioridad,
    estadoId: catalogs.estado.idEstado,
    label: "QF11",
  });
  ids.services.push(rejectService.idSolicitudServicio);
  await request(`/services/${rejectService.idSolicitudServicio}`, {
    token: tokens.admin,
    method: "PATCH",
    body: { technicianId: tecnico.idUsuario },
  });
  const rejectQuoteCreate = await request("/quotes", {
    token: tokens.tecnico,
    method: "POST",
    body: { serviceId: rejectService.idSolicitudServicio, monto: 90000 },
  });
  const rejectQuote = await latestQuoteForService(rejectService.idSolicitudServicio);
  ids.quotes.push(rejectQuote?.idCotizacion);
  const reject = await request(`/quotes/${rejectQuote.idCotizacion}/reject`, {
    token: tokens.usuario,
    method: "POST",
    body: { motivo: "Valor alto" },
  });
  const rejectedQuote = await latestQuoteForService(rejectService.idSolicitudServicio);
  addResult(results, "QF11", "Usuario rechaza cotizacion", "No existia rechazo formal", "Reject cambia estado a Rechazada", rejectQuoteCreate.status === 201 && reject.status === 200 && rejectedQuote?.estado === "Rechazada", {
    status: reject.status,
  });

  addResult(results, "QF12", "Cotizacion rechazada no genera pago", "Riesgo de pago sin aprobacion", "Reject no crea pago", !rejectedQuote?.idPago && await countPaymentsForService(rejectService.idSolicitudServicio) === 0, {});

  const noPayService = await createService({
    userId: usuario.idUsuario,
    tipoServicioId: catalogs.tipoServicio.idTipoServicio,
    prioridadId: catalogs.prioridad.idPrioridad,
    estadoId: catalogs.estado.idEstado,
    label: "QF13",
  });
  ids.services.push(noPayService.idSolicitudServicio);
  await request(`/services/${noPayService.idSolicitudServicio}`, {
    token: tokens.admin,
    method: "PATCH",
    body: { technicianId: tecnico.idUsuario },
  });
  await request("/quotes", {
    token: tokens.tecnico,
    method: "POST",
    body: { serviceId: noPayService.idSolicitudServicio, monto: 110000 },
  });
  const noApprovedQuote = await latestQuoteForService(noPayService.idSolicitudServicio);
  ids.quotes.push(noApprovedQuote?.idCotizacion);
  const noPaymentAttempt = await request("/payments/999999/initiate", {
    token: tokens.usuario,
    method: "POST",
    body: { method: "Efectivo", serviceId: noPayService.idSolicitudServicio },
  });
  addResult(results, "QF13", "No se puede pagar sin cotizacion aprobada", "No debe existir pago antes de aprobar", "Cotizacion Enviada no tiene id_pago y endpoint responde controlado", noApprovedQuote?.estado === "Enviada" && !noApprovedQuote?.idPago && noPaymentAttempt.status === 400, {
    status: noPaymentAttempt.status,
  });

  const pay = await request(`/payments/${payment.idPago}/initiate`, {
    token: tokens.usuario,
    method: "POST",
    body: { method: "Efectivo" },
  });
  addResult(results, "QF14", "Usuario puede pagar despues de aprobar", "Pago se crea solo al aprobar", "Flujo existente de pagos procesa pago generado", pay.status === 200 && pay.payload.status === "Pagado", {
    status: pay.status,
  });

  const confirm = await request(`/payments/${payment.idPago}/confirm-technician`, {
    token: tokens.tecnico,
    method: "POST",
    body: { method: "Efectivo" },
  });
  addResult(results, "QF15", "Tecnico confirma pago si existe", "Confirmacion requeria pago real", "Pago generado por cotizacion usa flujo existente", confirm.status === 200 && confirm.payload.code === "PAYMENT_CONFIRMED", {
    status: confirm.status,
  });

  const paymentsList = await request("/payments", { token: tokens.admin });
  addResult(results, "QF16", "Pagos historicos siguen funcionando", "Riesgo de romper listados historicos", "GET /payments conserva pagos", paymentsList.status === 200 && Array.isArray(paymentsList.payload), {
    status: paymentsList.status,
  });

  const adminServices = await request("/services", { token: tokens.admin });
  const adminSeesQuote = adminServices.payload.find(item => item.id === service.idSolicitudServicio);
  addResult(results, "QF17", "Admin ve estado cotizacion y pago", "Admin necesita visibilidad sin editar monto", "Servicios incluyen quoteStatus y paymentStatus", adminServices.status === 200 && adminSeesQuote?.quote?.id === quote.idCotizacion && adminSeesQuote?.paymentId === payment.idPago, {
    status: adminServices.status,
  });

  const health = await request("/health");
  const me = await request("/auth/me", { token: tokens.usuario });
  const appointments = await request("/appointments", { token: tokens.admin });
  const notifications = await request("/notifications", { token: tokens.usuario });
  const advisories = await request("/advisories", { token: tokens.admin });
  addResult(results, "QF18", "No regresion general", "Riesgo en modulos principales", "Endpoints principales responden", [health, me, adminServices, appointments, paymentsList, notifications, advisories].every(item => item.status === 200), {
    health: health.status,
    auth: me.status,
    services: adminServices.status,
    appointments: appointments.status,
    payments: paymentsList.status,
    notifications: notifications.status,
    advisories: advisories.status,
  });

  const failed = results.filter(result => result.resultadoFinal !== "PASS");
  console.log(`\nQUOTES_FLOW_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length) process.exitCode = 1;
}

main()
  .catch(error => {
    console.error("QUOTES_FLOW_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (serverProcess) serverProcess.kill();
    await prisma.$disconnect();
  });
