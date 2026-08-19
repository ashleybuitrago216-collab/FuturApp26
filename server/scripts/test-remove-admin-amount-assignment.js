import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../src/config/prisma.js";

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:4000/api";
const PASSWORD = "123456";
const PREFIX = "PRUEBA_AM";
const SHOULD_START_SERVER = process.argv.includes("--start-server");

let serverProcess = null;
const results = [];
const ids = { users: {}, services: [], appointments: [], payments: [], advisories: [] };

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, ok: response.ok, data };
}

function addResult(id, test, initial, correction, passed, details = {}) {
  const row = {
    id,
    test,
    resultadoInicial: initial,
    correccionAplicada: correction,
    resultadoFinal: passed ? "PASS" : "FAIL",
    ...details,
  };
  results.push(row);
  console.log(`${row.resultadoFinal} ${id} - ${test}`);
  if (!passed) console.log(JSON.stringify(row, null, 2));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function healthOk() {
  try {
    return (await request("/health")).status === 200;
  } catch {
    return false;
  }
}

async function startServer() {
  if (!SHOULD_START_SERVER) return;
  if (await healthOk()) return;

  serverProcess = spawn(process.execPath, ["src/server.js"], {
    cwd: new URL("..", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  serverProcess.stdout.on("data", chunk => process.stdout.write(`[api] ${chunk}`));
  serverProcess.stderr.on("data", chunk => process.stderr.write(`[api] ${chunk}`));

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await healthOk()) return;
    await wait(500);
  }
  throw new Error("API no disponible.");
}

async function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    await wait(500);
    serverProcess = null;
  }
}

async function role(name) {
  return prisma.rol.upsert({
    where: { nombreRol: name },
    update: {},
    create: { nombreRol: name },
  });
}

async function catalogByName(model, field, value, fallbackData = {}) {
  const rows = await prisma[model].findMany();
  const found = rows.find(item => String(item[field] || "").toLowerCase() === String(value).toLowerCase());
  if (found) return found;
  return prisma[model].create({ data: { [field]: value, ...fallbackData } });
}

async function ensureUser({ email, nombre, apellido, roleName, areaId = null }) {
  const rol = await role(roleName);
  const contrasenaHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.usuario.upsert({
    where: { correo: email },
    update: { nombre, apellido, contrasenaHash, idRol: rol.idRol, activo: true, idAreaEspecialidad: areaId },
    create: { correo: email, nombre, apellido, contrasenaHash, idRol: rol.idRol, activo: true, idAreaEspecialidad: areaId },
    include: { rol: true },
  });
}

async function setupUsers() {
  const area = await catalogByName("areaEspecialidad", "nombreAreaEspecialidad", `${PREFIX} Soporte`);
  const admin = await ensureUser({ email: "prueba_am_admin@futurapp.local", nombre: "Prueba", apellido: "AM Admin", roleName: "Administrador" });
  const usuario = await ensureUser({ email: "prueba_am_usuario@futurapp.local", nombre: "Prueba", apellido: "AM Usuario", roleName: "Usuario" });
  const tecnico = await ensureUser({ email: "prueba_am_tecnico@futurapp.local", nombre: "Prueba", apellido: "AM Tecnico", roleName: "Tecnico", areaId: area.idAreaEspecialidad });
  const asesor = await ensureUser({ email: "prueba_am_asesor@futurapp.local", nombre: "Prueba", apellido: "AM Asesor", roleName: "Asesor" });
  ids.users = {
    admin: admin.idUsuario,
    usuario: usuario.idUsuario,
    tecnico: tecnico.idUsuario,
    asesor: asesor.idUsuario,
  };
}

async function login(email) {
  const response = await request("/auth/login", { method: "POST", body: { email, password: PASSWORD } });
  assert(response.status === 200, `Login fallo ${email}: ${response.status}`);
  return response.data;
}

async function setupCatalogs() {
  const tipo = await prisma.tipoServicio.findFirst({ orderBy: { idTipoServicio: "asc" } });
  const prioridad = await catalogByName("prioridad", "nombrePrioridad", "Media");
  const estado = await catalogByName("estado", "nombreEstado", "Pendiente");
  const estadoPago = await catalogByName("estadoPago", "nombreEstadoPago", "Pendiente", { descripcion: "Pendiente" });
  return { tipo, prioridad, estado, estadoPago };
}

async function createService({ label = "base", userId = ids.users.usuario } = {}) {
  const { tipo, prioridad, estado } = await setupCatalogs();
  const service = await prisma.solicitudServicio.create({
    data: {
      idUsuario: userId,
      idTipoServicio: tipo.idTipoServicio,
      descripcionProblema: `${PREFIX} ${label}: servicio sin monto administrativo.`,
      idPrioridad: prioridad.idPrioridad,
      idEstado: estado.idEstado,
    },
  });
  ids.services.push(service.idSolicitudServicio);
  return service;
}

async function countPaymentsForService(serviceId) {
  return prisma.pago.count({ where: { cita: { idSolicitudServicio: serviceId } } });
}

function futureDate(days = 2) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function run() {
  await startServer();
  await setupUsers();
  const catalogs = await setupCatalogs();

  const admin = await login("prueba_am_admin@futurapp.local");
  const usuario = await login("prueba_am_usuario@futurapp.local");
  const tecnico = await login("prueba_am_tecnico@futurapp.local");
  const asesor = await login("prueba_am_asesor@futurapp.local");

  const service = await createService({ label: "AM01" });
  const beforeAssignPayments = await countPaymentsForService(service.idSolicitudServicio);
  const assignNoAmount = await request(`/services/${service.idSolicitudServicio}`, {
    token: admin.token,
    method: "PATCH",
    body: { technicianId: ids.users.tecnico },
  });
  const assignedAppointment = await prisma.cita.findUnique({
    where: { idSolicitudServicio: service.idSolicitudServicio },
  });
  if (assignedAppointment) ids.appointments.push(assignedAppointment.idCita);
  const afterAssignPayments = await countPaymentsForService(service.idSolicitudServicio);
  addResult("AM01", "Admin asigna tecnico sin monto", "Asignacion podia depender de monto para crear pago", "PATCH /services/:id acepta technicianId sin monto y no crea pago", assignNoAmount.status === 200
    && assignedAppointment?.idUsuarioTecnico === ids.users.tecnico
    && beforeAssignPayments === afterAssignPayments, {
    status: assignNoAmount.status,
    serviceId: service.idSolicitudServicio,
    citaId: assignedAppointment?.idCita,
    paymentsBefore: beforeAssignPayments,
    paymentsAfter: afterAssignPayments,
  });

  const serviceWithAmountAttempt = await createService({ label: "AM02" });
  const assignWithAmount = await request(`/services/${serviceWithAmountAttempt.idSolicitudServicio}`, {
    token: admin.token,
    method: "PATCH",
    body: { technicianId: ids.users.tecnico, monto: 120000 },
  });
  const amountAttemptPayments = await countPaymentsForService(serviceWithAmountAttempt.idSolicitudServicio);
  addResult("AM02", "Admin intenta enviar monto", "Admin podia crear pago desde monto", "Backend rechaza payload economico con 400", assignWithAmount.status === 400 && amountAttemptPayments === 0, {
    status: assignWithAmount.status,
    payments: amountAttemptPayments,
  });

  const servicesPage = readFileSync(new URL("../../src/pages/ServiciosPage.jsx", import.meta.url), "utf8");
  const appointmentMapper = readFileSync(new URL("../../src/domains/appointments/services/appointmentMappers.js", import.meta.url), "utf8");
  const schedulePayloadBody = appointmentMapper.match(/export function mapScheduleToApiPayload[\s\S]*?\n}/)?.[0] || "";
  addResult("AM03", "Frontend no envia monto", "Servicios/Citas enviaban monto en payload", "Payloads de asignacion y schedule ya no incluyen monto", !/serviceAmount|formatCopInput|cleanCopValue/.test(servicesPage)
    && !/monto|amount|serviceAmount|valorServicio|montoServicio|total|precio/.test(schedulePayloadBody), {});

  addResult("AM04", "Formulario admin sin campo monto", "Servicios y Citas mostraban input de monto", "Se removieron inputs y textos de monto editable", !/Monto del servicio|placeholder="\$ COP"|inputMode="numeric"/.test(servicesPage)
    && !/Monto del servicio|placeholder="\$120\.000 COP"|inputMode="numeric"/.test(readFileSync(new URL("../../src/pages/CitasPage.jsx", import.meta.url), "utf8")), {});

  const scheduleNoAmount = await request(`/appointments/${assignedAppointment.idCita}/schedule`, {
    token: admin.token,
    method: "PATCH",
    body: { fecha: futureDate(3), hora: "09:15" },
  });
  const scheduledAppointment = await prisma.cita.findUnique({ where: { idCita: assignedAppointment.idCita } });
  const afterSchedulePayments = await countPaymentsForService(service.idSolicitudServicio);
  addResult("AM05", "Programar cita sin monto", "Programacion podia crear pago con monto", "Schedule guarda fecha/hora sin pago automatico", scheduleNoAmount.status === 200
    && Boolean(scheduledAppointment.fecha)
    && Boolean(scheduledAppointment.hora)
    && afterSchedulePayments === beforeAssignPayments, {
    status: scheduleNoAmount.status,
    citaId: assignedAppointment.idCita,
    payments: afterSchedulePayments,
  });

  const scheduleWithAmount = await request(`/appointments/${assignedAppointment.idCita}/schedule`, {
    token: admin.token,
    method: "PATCH",
    body: { fecha: futureDate(4), hora: "10:00", monto: 120000 },
  });
  addResult("AM06", "Programar cita con monto", "Endpoint aceptaba monto y creaba pago", "Backend rechaza monto con 400", scheduleWithAmount.status === 400, { status: scheduleWithAmount.status });

  const adminServices = await request("/services", { token: admin.token });
  addResult("AM07", "Servicio sin pago no rompe listado admin", "Servicios asignados asumian pago", "GET /services no depende de pago", adminServices.status === 200
    && adminServices.data.some(item => item.id === service.idSolicitudServicio), { status: adminServices.status });

  const userServices = await request("/services", { token: usuario.token });
  addResult("AM08", "Servicio sin pago no rompe listado usuario", "Usuario podia depender de pago creado", "GET /services usuario no depende de pago", userServices.status === 200
    && userServices.data.some(item => item.id === service.idSolicitudServicio), { status: userServices.status });

  const payMissing = await request("/payments/999999/initiate", {
    token: usuario.token,
    method: "POST",
    body: { method: "DaviPlata" },
  });
  addResult("AM09", "Usuario no puede pagar si no hay pago", "Podia asumirse pago por servicio asignado", "Sin registro pago el endpoint responde controlado", payMissing.status === 404, { status: payMissing.status });

  const historicalPayment = await prisma.pago.create({
    data: {
      idCita: assignedAppointment.idCita,
      idUsuario: ids.users.usuario,
      monto: 45000,
      idEstadoPago: catalogs.estadoPago.idEstadoPago,
      fechaPago: null,
    },
  });
  ids.payments.push(historicalPayment.idPago);
  const paymentsList = await request("/payments", { token: admin.token });
  addResult("AM10", "Pagos historicos siguen funcionando", "Riesgo de romper pagos con monto", "Pagos existentes se listan y conservan monto solo lectura", paymentsList.status === 200
    && paymentsList.data.some(item => item.id === historicalPayment.idPago && Number(item.amount) === 45000), {
    status: paymentsList.status,
    paymentId: historicalPayment.idPago,
  });

  const confirmMissing = await request("/payments/999999/confirm-technician", {
    token: tecnico.token,
    method: "POST",
    body: { method: "DaviPlata" },
  });
  addResult("AM11", "Tecnico no confirma pago inexistente", "Tecnico podia asumir pago por servicio", "Endpoint responde 404 controlado", confirmMissing.status === 404, { status: confirmMissing.status });

  const reassign = await request(`/services/${service.idSolicitudServicio}`, {
    token: admin.token,
    method: "PATCH",
    body: { technicianId: null },
  });
  const reassignBack = await request(`/services/${service.idSolicitudServicio}`, {
    token: admin.token,
    method: "PATCH",
    body: { technicianId: ids.users.tecnico },
  });
  addResult("AM12", "No regresion de asignacion tecnica", "Riesgo al quitar pago automatico", "Asignar/reasignar tecnico sigue funcionando sin monto", reassign.status === 200 && reassignBack.status === 200, {
    unassign: reassign.status,
    assign: reassignBack.status,
  });

  const advisoryCreate = await request("/advisories", {
    token: usuario.token,
    method: "POST",
    body: {
      descripcionInicial: `${PREFIX} asesoria sin monto administrativo`,
      tipoDispositivo: "Computador",
      fechaContacto: futureDate(5),
      horaContacto: "14:00",
    },
  });
  const advisoryId = advisoryCreate.data?.id;
  if (advisoryId) ids.advisories.push(advisoryId);
  await request(`/advisories/${advisoryId}/assign`, {
    token: admin.token,
    method: "PATCH",
    body: { asesorId: ids.users.asesor },
  });
  const resolveAdvisory = await request(`/advisories/${advisoryId}/resolve`, {
    token: asesor.token,
    method: "PATCH",
    body: {
      tipoServicioId: catalogs.tipo.idTipoServicio,
      descripcionServicioFinal: `${PREFIX} servicio generado sin monto automatico`,
    },
  });
  const advisoryServiceId = resolveAdvisory.data?.service?.id || resolveAdvisory.data?.servicio?.id;
  if (advisoryServiceId) ids.services.push(advisoryServiceId);
  const advisoryAdminServices = await request("/services", { token: admin.token });
  addResult("AM13", "No regresion de asesorias", "Riesgo de romper servicios generados desde asesoria", "Servicio generado aparece para admin sin pago automatico", resolveAdvisory.status === 200
    && advisoryAdminServices.data.some(item => item.id === advisoryServiceId), {
    resolve: resolveAdvisory.status,
    serviceId: advisoryServiceId,
  });

  const paymentsSummary = await request("/payments/summary", { token: admin.token });
  const paymentsUser = await request("/payments", { token: usuario.token });
  addResult("AM14", "No regresion de pagos", "Riesgo de romper endpoints pagos", "Listados y summary siguen funcionando", paymentsSummary.status === 200 && paymentsUser.status === 200, {
    summary: paymentsSummary.status,
    list: paymentsUser.status,
  });

  const regression = {
    health: (await request("/health")).status,
    auth: (await request("/auth/me", { token: admin.token })).status,
    users: (await request("/users/me", { token: usuario.token })).status,
    services: (await request("/services", { token: admin.token })).status,
    appointments: (await request("/appointments", { token: admin.token })).status,
    payments: (await request("/payments", { token: admin.token })).status,
    notifications: (await request("/notifications", { token: admin.token })).status,
    advisories: (await request("/advisories", { token: admin.token })).status,
  };
  addResult("AM15", "No regresion general", "Riesgo en modulos principales", "Endpoints principales responden", Object.values(regression).every(status => status === 200), regression);

  const failed = results.filter(item => item.resultadoFinal !== "PASS");
  console.log(`\nREMOVE_ADMIN_AMOUNT_ASSIGNMENT_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length > 0) process.exitCode = 1;
}

run()
  .catch(error => {
    console.error("REMOVE_ADMIN_AMOUNT_ASSIGNMENT_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
    await prisma.$disconnect();
  });
