import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || "http://localhost:4000/api";
const PASSWORD = "Password123!";
const PREFIX = "PRUEBA_ASC";
const shouldStartServer = process.argv.includes("--start-server");
let serverProcess = null;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    // Start local API below.
  }
  serverProcess = spawn("node", ["src/server.js"], {
    cwd: new URL("../", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", chunk => process.stdout.write(`[api] ${chunk}`));
  serverProcess.stderr.on("data", chunk => process.stderr.write(`[api] ${chunk}`));
  await wait(2500);
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

async function roleByName(nombreRol) {
  return prisma.rol.upsert({
    where: { nombreRol },
    update: {},
    create: { nombreRol },
  });
}

async function setupCatalogs() {
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
  await prisma.estado.upsert({
    where: { nombreEstado: "Pendiente" },
    update: {},
    create: { nombreEstado: "Pendiente" },
  });
  await prisma.prioridad.upsert({
    where: { nombrePrioridad: "Media" },
    update: {},
    create: { nombrePrioridad: "Media" },
  });
  const tipoServicio = await prisma.tipoServicio.findFirst({
    where: { nombreServicio: { notIn: ["Asesoria", "Asesoría"] } },
    orderBy: { idTipoServicio: "asc" },
  }) || await prisma.tipoServicio.create({
    data: {
      nombreServicio: `${PREFIX}_Servicio tecnico`,
      descripcionServicio: "Servicio tecnico de prueba",
    },
  });
  await prisma.medioPago.upsert({
    where: { nombreMedioPago: "Efectivo" },
    update: {},
    create: { nombreMedioPago: "Efectivo" },
  });

  return { adminRole, userRole, techRole, advisorRole, area, tipoServicio };
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

function futureDate(days = 3) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const ids = { users: {}, services: [], advisories: [], quotes: [], payments: [], appointments: [] };
  const results = [];
  await startServerIfNeeded();

  const catalogs = await setupCatalogs();
  const admin = await ensureUser({ email: "prueba_asc_admin@futurapp.local", roleId: catalogs.adminRole.idRol });
  const usuario = await ensureUser({ email: "prueba_asc_usuario@futurapp.local", roleId: catalogs.userRole.idRol });
  const tecnico = await ensureUser({ email: "prueba_asc_tecnico@futurapp.local", roleId: catalogs.techRole.idRol, areaId: catalogs.area.idAreaEspecialidad });
  const asesor = await ensureUser({ email: "prueba_asc_asesor@futurapp.local", roleId: catalogs.advisorRole.idRol });
  ids.users = {
    admin: admin.idUsuario,
    usuario: usuario.idUsuario,
    tecnico: tecnico.idUsuario,
    asesor: asesor.idUsuario,
  };

  const tokens = {
    admin: await login(admin.correo),
    usuario: await login(usuario.correo),
    tecnico: await login(tecnico.correo),
    asesor: await login(asesor.correo),
  };

  const servicesPage = readFileSync(new URL("../../src/pages/ServiciosPage.jsx", import.meta.url), "utf8");
  addResult(
    results,
    "ASC01",
    "Admin no ve boton Nuevo servicio",
    "El boton se renderizaba para admin y usuario",
    "La accion del PageHead depende de canCreateService usuario",
    /canCreateService \? <BtnPrimary[\s\S]*Nuevo servicio/.test(servicesPage) && !/action=\{!isTechnicianOnly/.test(servicesPage),
  );

  addResult(
    results,
    "ASC02",
    "Admin no puede abrir formulario de creacion",
    "El modal form se podia abrir desde boton admin",
    "La apertura de creacion solo esta en canCreateService y save tiene guarda",
    /if \(!editId && !canCreateService\)/.test(servicesPage) && /setModal\("form"\)/.test(servicesPage),
  );

  addResult(
    results,
    "ASC03",
    "Admin no envia payload de creacion desde frontend",
    "save podia llamar createService en modo creacion admin",
    "Guard frontend bloquea no usuarios y backend bloquea admin",
    /servicesApi\.createService/.test(servicesPage) && /El administrador no puede crear servicios/.test(servicesPage),
  );

  const adminCreate = await request("/services", {
    token: tokens.admin,
    method: "POST",
    body: {
      description: `${PREFIX} intento admin`,
      serviceTypeId: catalogs.tipoServicio.idTipoServicio,
    },
  });
  addResult(
    results,
    "ASC04",
    "Admin no crea servicio por API",
    "POST /api/services permitia admin",
    "servicesService.create rechaza admin con 403",
    adminCreate.status === 403,
    { status: adminCreate.status },
  );

  const userCreate = await request("/services", {
    token: tokens.usuario,
    method: "POST",
    body: {
      description: `${PREFIX} servicio creado por usuario ${Date.now()}`,
      serviceTypeId: catalogs.tipoServicio.idTipoServicio,
    },
  });
  ids.services.push(userCreate.payload.id);
  const assign = await request(`/services/${userCreate.payload.id}`, {
    token: tokens.admin,
    method: "PATCH",
    body: { technicianId: tecnico.idUsuario },
  });
  const cita = await prisma.cita.findUnique({ where: { idSolicitudServicio: userCreate.payload.id } });
  ids.appointments.push(cita?.idCita);
  const schedule = cita ? await request(`/appointments/${cita.idCita}/schedule`, {
    token: tokens.admin,
    method: "PATCH",
    body: { fecha: futureDate(4), hora: "09:30" },
  }) : { status: 0 };
  addResult(
    results,
    "ASC05",
    "Admin conserva gestion",
    "Riesgo de bloquear gestion completa",
    "GET/PATCH services y schedule siguen funcionando",
    userCreate.status === 201 && assign.status === 200 && schedule.status === 200,
    { createUserStatus: userCreate.status, assignStatus: assign.status, scheduleStatus: schedule.status },
  );

  addResult(
    results,
    "ASC06",
    "Usuario puede crear servicio si aplica",
    "No se debe romper creacion usuario",
    "POST /services conserva rol usuario",
    userCreate.status === 201,
    { status: userCreate.status, serviceId: userCreate.payload.id },
  );

  const techCreate = await request("/services", {
    token: tokens.tecnico,
    method: "POST",
    body: { description: `${PREFIX} tecnico no crea` },
  });
  addResult(results, "ASC07", "Tecnico no puede crear servicio", "Tecnico no debe crear", "POST /services rechaza no usuario", techCreate.status === 403, { status: techCreate.status });

  const advisorCreate = await request("/services", {
    token: tokens.asesor,
    method: "POST",
    body: { description: `${PREFIX} asesor no crea` },
  });
  addResult(results, "ASC08", "Asesor no crea servicio manual por POST", "Asesor no debe usar POST services", "POST /services rechaza asesor", advisorCreate.status === 403, { status: advisorCreate.status });

  const advisoryCreate = await request("/advisories", {
    token: tokens.usuario,
    method: "POST",
    body: {
      descripcionInicial: `${PREFIX} asesoria para generar servicio`,
      tipoDispositivo: "Computador",
      fechaContacto: futureDate(5),
      horaContacto: "10:00",
    },
  });
  const advisoryId = advisoryCreate.payload.id || advisoryCreate.payload.advisory?.id || advisoryCreate.payload.asesoria?.id;
  ids.advisories.push(advisoryId);
  await request(`/advisories/${advisoryId}/assign`, {
    token: tokens.admin,
    method: "PATCH",
    body: { asesorId: asesor.idUsuario },
  });
  const catalogsResponse = await request("/advisories/catalogs", { token: tokens.asesor });
  const tipo = catalogsResponse.payload.tiposServicio?.[0];
  const resolve = await request(`/advisories/${advisoryId}/resolve`, {
    token: tokens.asesor,
    method: "PATCH",
    body: {
      tipoServicioId: tipo.id,
      descripcionServicioFinal: `${PREFIX} servicio generado desde asesoria`,
    },
  });
  const resolvedServiceId = resolve.payload.service?.id || resolve.payload.servicio?.id;
  if (resolvedServiceId) ids.services.push(resolvedServiceId);
  const adminServicesAfterAdvisory = await request("/services", { token: tokens.admin });
  addResult(
    results,
    "ASC09",
    "Asesoria genera servicio correctamente",
    "Riesgo de romper crearServicioDesdeAsesoria",
    "Funcion interna se mantiene independiente del POST admin",
    resolve.status === 200 && Boolean(resolvedServiceId) && adminServicesAfterAdvisory.payload.some(item => item.id === resolvedServiceId),
    { advisoryStatus: resolve.status, serviceId: resolvedServiceId },
  );

  const quote = await request("/quotes", {
    token: tokens.tecnico,
    method: "POST",
    body: {
      serviceId: userCreate.payload.id,
      monto: 130000,
      descripcion: `${PREFIX} cotizacion`,
    },
  });
  ids.quotes.push(quote.payload.id);
  addResult(results, "ASC10", "Cotizaciones no se rompen", "Riesgo en flujo tecnico", "Tecnico cotiza servicio existente", quote.status === 201, { status: quote.status, quoteId: quote.payload.id });

  const approve = await request(`/quotes/${quote.payload.id}/approve`, {
    token: tokens.usuario,
    method: "POST",
  });
  const quoteDb = await prisma.cotizacion.findUnique({ where: { idCotizacion: quote.payload.id } });
  ids.payments.push(quoteDb?.idPago);
  addResult(results, "ASC11", "Pagos no se rompen", "Riesgo en aprobacion de cotizacion", "Aprobar cotizacion genera pago", approve.status === 200 && Boolean(quoteDb?.idPago), { status: approve.status, paymentId: quoteDb?.idPago });

  const health = await request("/health");
  const me = await request("/auth/me", { token: tokens.usuario });
  const services = await request("/services", { token: tokens.admin });
  const appointments = await request("/appointments", { token: tokens.admin });
  const quotes = await request("/quotes", { token: tokens.admin });
  const payments = await request("/payments", { token: tokens.admin });
  const notifications = await request("/notifications", { token: tokens.usuario });
  const advisories = await request("/advisories", { token: tokens.admin });
  addResult(
    results,
    "ASC12",
    "No regresion general",
    "Riesgo en modulos principales",
    "Endpoints principales responden",
    [health, me, services, appointments, quotes, payments, notifications, advisories].every(item => item.status === 200),
    {
      health: health.status,
      auth: me.status,
      services: services.status,
      appointments: appointments.status,
      quotes: quotes.status,
      payments: payments.status,
      notifications: notifications.status,
      advisories: advisories.status,
    },
  );

  const failed = results.filter(result => result.resultadoFinal !== "PASS");
  console.log(`\nREMOVE_ADMIN_SERVICE_CREATION_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length) process.exitCode = 1;
}

main()
  .catch(error => {
    console.error("REMOVE_ADMIN_SERVICE_CREATION_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (serverProcess) serverProcess.kill();
    await prisma.$disconnect();
  });
