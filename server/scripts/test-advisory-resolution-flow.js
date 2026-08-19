import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../src/config/prisma.js";

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:4000/api";
const PASSWORD = "123456";
const PREFIX = "PRUEBA_AR";
const SHOULD_START_SERVER = process.argv.includes("--start-server");

let serverProcess = null;
const results = [];
const ids = {
  advisories: [],
  services: [],
  notifications: [],
  users: {},
};

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

function futureDate(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00`);
}

async function healthOk() {
  try {
    const response = await request("/health");
    return response.status === 200;
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

async function ensureUser({ email, nombre, apellido, roleName, active = true }) {
  const rol = await role(roleName);
  const contrasenaHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.usuario.upsert({
    where: { correo: email },
    update: {
      nombre,
      apellido,
      contrasenaHash,
      idRol: rol.idRol,
      activo: active,
    },
    create: {
      correo: email,
      nombre,
      apellido,
      contrasenaHash,
      idRol: rol.idRol,
      activo: active,
    },
    include: { rol: true },
  });
}

async function setupUsers() {
  const admin = await ensureUser({ email: "prueba_ar_admin@futurapp.local", nombre: "Prueba", apellido: "AR Admin", roleName: "Administrador" });
  const usuario = await ensureUser({ email: "prueba_ar_usuario@futurapp.local", nombre: "Prueba", apellido: "AR Usuario", roleName: "Usuario" });
  const tecnico = await ensureUser({ email: "prueba_ar_tecnico@futurapp.local", nombre: "Prueba", apellido: "AR Tecnico", roleName: "Tecnico" });
  const asesor = await ensureUser({ email: "prueba_ar_asesor@futurapp.local", nombre: "Prueba", apellido: "AR Asesor", roleName: "Asesor" });
  const asesorAjeno = await ensureUser({ email: "prueba_ar_asesor_ajeno@futurapp.local", nombre: "Prueba", apellido: "AR Ajeno", roleName: "Asesor" });
  const usuarioInactivo = await ensureUser({ email: "prueba_ar_usuario_inactivo@futurapp.local", nombre: "Prueba", apellido: "AR Inactivo", roleName: "Usuario", active: false });

  ids.users = {
    admin: admin.idUsuario,
    usuario: usuario.idUsuario,
    tecnico: tecnico.idUsuario,
    asesor: asesor.idUsuario,
    asesorAjeno: asesorAjeno.idUsuario,
    usuarioInactivo: usuarioInactivo.idUsuario,
  };
}

async function login(email) {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  assert(response.status === 200, `Login fallo ${email}: ${response.status}`);
  return response.data;
}

async function firstTipoServicio() {
  const tipo = await prisma.tipoServicio.findFirst({ orderBy: { idTipoServicio: "asc" } });
  assert(tipo, "No hay tipos_servicio disponibles.");
  return tipo;
}

async function createAssignedAdvisory({ usuarioId, asesorId, estado = "Pendiente", label = "pendiente" }) {
  const advisory = await prisma.asesoria.create({
    data: {
      idUsuarioSolicitante: usuarioId,
      idUsuarioAsesor: asesorId,
      fecha: futureDate(2),
      hora: new Date("1970-01-01T10:30:00"),
      estado,
      motivo: "Solicitud de asesoria",
      descripcion: `${PREFIX} ${label}: equipo con falla intermitente para diagnostico.`,
      tipoDispositivo: "Computador",
      telefonoPrincipal: "3001234567",
      telefonoAlterno: "3011234567",
      fechaCreacion: new Date(),
    },
  });
  ids.advisories.push(advisory.idAsesoria);
  return advisory;
}

async function activeAdmins() {
  const users = await prisma.usuario.findMany({
    where: { activo: true },
    include: { rol: true },
  });
  return users.filter(user => {
    const role = String(user.rol?.nombreRol || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return role === "administrador" || role === "admin";
  });
}

async function notificationCountForUser(userId, title) {
  return prisma.notificacion.count({
    where: { idUsuario: userId, ...(title ? { titulo: title } : {}) },
  });
}

async function run() {
  await startServer();
  await setupUsers();

  const admin = await login("prueba_ar_admin@futurapp.local");
  const usuario = await login("prueba_ar_usuario@futurapp.local");
  const tecnico = await login("prueba_ar_tecnico@futurapp.local");
  const asesor = await login("prueba_ar_asesor@futurapp.local");
  const asesorAjeno = await login("prueba_ar_asesor_ajeno@futurapp.local");
  const tipo = await firstTipoServicio();
  const admins = await activeAdmins();

  const pending = await createAssignedAdvisory({ usuarioId: usuario.user.id, asesorId: asesor.user.id, label: "AR01" });
  const resolvedSeed = await createAssignedAdvisory({ usuarioId: usuario.user.id, asesorId: asesor.user.id, estado: "Asesoria resuelta", label: "AR02" });
  const serviceForResolved = await prisma.solicitudServicio.create({
    data: {
      idUsuario: usuario.user.id,
      idTipoServicio: tipo.idTipoServicio,
      descripcionProblema: `${PREFIX} servicio seed resuelto`,
      idEstado: 2,
      idPrioridad: 2,
    },
  });
  ids.services.push(serviceForResolved.idSolicitudServicio);
  await prisma.asesoria.update({
    where: { idAsesoria: resolvedSeed.idAsesoria },
    data: { idSolicitudServicio: serviceForResolved.idSolicitudServicio, idTipoServicio: tipo.idTipoServicio, descripcionServicioFinal: serviceForResolved.descripcionProblema },
  });

  const advisorList = await request("/advisories", { token: asesor.token });
  const pendingVisible = advisorList.data.find(item => item.id === pending.idAsesoria);
  addResult("AR01", "Boton visible para asesoria pendiente", "No existia accion de respuesta", "Frontend muestra accion si estado Pendiente y sin serviceId", advisorList.status === 200 && pendingVisible?.estado === "Pendiente" && !pendingVisible?.serviceId, { advisoryId: pending.idAsesoria });

  const resolvedVisible = advisorList.data.find(item => item.id === resolvedSeed.idAsesoria);
  addResult("AR02", "Boton no visible para asesoria resuelta", "No existia estado resuelto con servicio", "Frontend oculta accion cuando existe serviceId o estado resuelto", advisorList.status === 200 && resolvedVisible?.serviceId === serviceForResolved.idSolicitudServicio, { advisoryId: resolvedSeed.idAsesoria, serviceId: serviceForResolved.idSolicitudServicio });

  const catalogs = await request("/advisories/catalogs", { token: asesor.token });
  addResult("AR03", "Catalogo real de tipos de servicio", "No habia catalogo para asesor", "GET /api/advisories/catalogs lee tipos_servicio", catalogs.status === 200 && catalogs.data.tiposServicio.some(item => item.id === tipo.idTipoServicio), { status: catalogs.status, tipoServicioId: tipo.idTipoServicio });

  const beforeUserNotifications = await notificationCountForUser(usuario.user.id, "Asesoria resuelta");
  const beforeAdvisorNotifications = await notificationCountForUser(asesor.user.id, "Asesoria finalizada");
  const beforeTechnicianNotifications = await notificationCountForUser(tecnico.user.id);
  const resolve = await request(`/advisories/${pending.idAsesoria}/resolve`, {
    token: asesor.token,
    method: "PATCH",
    body: {
      tipoServicioId: tipo.idTipoServicio,
      descripcionServicioFinal: `${PREFIX} descripcion final para crear servicio`,
    },
  });
  const advisoryDb = await prisma.asesoria.findUnique({ where: { idAsesoria: pending.idAsesoria }, include: { solicitudServicio: { include: { citas: true } }, tipoServicio: true } });
  const serviceDb = advisoryDb?.solicitudServicio;
  if (serviceDb?.idSolicitudServicio) ids.services.push(serviceDb.idSolicitudServicio);
  addResult("AR04", "Resolucion valida", "No existia endpoint de finalizacion", "PATCH /api/advisories/:id/resolve ejecuta transaccion", resolve.status === 200
    && advisoryDb?.estado === "Asesoria resuelta"
    && advisoryDb?.idSolicitudServicio
    && serviceDb?.idSolicitudServicio === advisoryDb.idSolicitudServicio, {
    status: resolve.status,
    advisoryId: pending.idAsesoria,
    serviceId: advisoryDb?.idSolicitudServicio,
  });

  const servicePayments = await prisma.pago.count({ where: { cita: { idSolicitudServicio: serviceDb?.idSolicitudServicio || -1 } } });
  addResult("AR05", "Servicio generado correctamente", "No habia relacion asesoría-servicio", "Servicio se crea Pendiente, sin tecnico/cita/pago", serviceDb?.idUsuario === usuario.user.id
    && serviceDb?.idTipoServicio === tipo.idTipoServicio
    && serviceDb?.descripcionProblema === `${PREFIX} descripcion final para crear servicio`
    && serviceDb?.idEstado === 2
    && serviceDb?.idEquipo === null
    && serviceDb?.citas.length === 0
    && servicePayments === 0, {
    service: serviceDb && {
      id: serviceDb.idSolicitudServicio,
      usuario: serviceDb.idUsuario,
      tipo: serviceDb.idTipoServicio,
      estado: serviceDb.idEstado,
      citas: serviceDb.citas.length,
      pagos: servicePayments,
    },
  });

  const userAdvisory = await request(`/advisories/${pending.idAsesoria}`, { token: usuario.token });
  addResult("AR06", "Usuario ve resultado", "Vista usuario no mostraba resultado final", "Mapper y UI exponen tipo final, descripcion y serviceId", userAdvisory.status === 200
    && userAdvisory.data.serviceId === serviceDb.idSolicitudServicio
    && userAdvisory.data.descripcionServicioFinal === serviceDb.descripcionProblema
    && userAdvisory.data.tipoServicioId === tipo.idTipoServicio, {
    status: userAdvisory.status,
    serviceId: userAdvisory.data?.serviceId,
  });

  const adminServices = await request("/services", { token: admin.token });
  addResult("AR07", "Admin ve servicio", "Servicio no se generaba", "Servicio aparece en GET /api/services para admin", adminServices.status === 200 && adminServices.data.some(item => item.id === serviceDb.idSolicitudServicio), { status: adminServices.status, serviceId: serviceDb.idSolicitudServicio });

  const otherPending = await createAssignedAdvisory({ usuarioId: usuario.user.id, asesorId: asesor.user.id, label: "AR08" });
  const foreignResolve = await request(`/advisories/${otherPending.idAsesoria}/resolve`, {
    token: asesorAjeno.token,
    method: "PATCH",
    body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: `${PREFIX} intento asesor ajeno` },
  });
  addResult("AR08", "Asesor ajeno", "No existia endpoint", "Valida asesor asignado", foreignResolve.status === 403, { status: foreignResolve.status });

  const rolePending = await createAssignedAdvisory({ usuarioId: usuario.user.id, asesorId: asesor.user.id, label: "AR09" });
  const userResolve = await request(`/advisories/${rolePending.idAsesoria}/resolve`, { token: usuario.token, method: "PATCH", body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: `${PREFIX} usuario no autorizado` } });
  const techResolve = await request(`/advisories/${rolePending.idAsesoria}/resolve`, { token: tecnico.token, method: "PATCH", body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: `${PREFIX} tecnico no autorizado` } });
  const adminResolve = await request(`/advisories/${rolePending.idAsesoria}/resolve`, { token: admin.token, method: "PATCH", body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: `${PREFIX} admin no autorizado` } });
  addResult("AR09", "Rol incorrecto", "No existia endpoint", "Solo rol asesor puede resolver", userResolve.status === 403 && techResolve.status === 403 && adminResolve.status === 403, { usuario: userResolve.status, tecnico: techResolve.status, admin: adminResolve.status });

  const invalidType = await request(`/advisories/${rolePending.idAsesoria}/resolve`, { token: asesor.token, method: "PATCH", body: { tipoServicioId: 999999, descripcionServicioFinal: `${PREFIX} tipo inexistente` } });
  addResult("AR10", "Tipo invalido", "Catalogo no validado", "Backend valida tipo real", invalidType.status === 404, { status: invalidType.status });

  const emptyDescription = await request(`/advisories/${rolePending.idAsesoria}/resolve`, { token: asesor.token, method: "PATCH", body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: "   " } });
  addResult("AR11", "Descripcion vacia", "No existia validacion", "Descripcion final obligatoria", emptyDescription.status === 400, { status: emptyDescription.status });

  const secondAttempt = await request(`/advisories/${pending.idAsesoria}/resolve`, { token: asesor.token, method: "PATCH", body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: `${PREFIX} segundo intento no duplica` } });
  const servicesForAdvisory = await prisma.asesoria.findUnique({ where: { idAsesoria: pending.idAsesoria }, select: { idSolicitudServicio: true } });
  addResult("AR12", "Segundo intento no duplica", "Sin relacion unica podia duplicar", "FK unica y validacion retornan 409", secondAttempt.status === 409 && servicesForAdvisory.idSolicitudServicio === serviceDb.idSolicitudServicio, { status: secondAttempt.status, serviceId: servicesForAdvisory.idSolicitudServicio });

  const inactivePending = await createAssignedAdvisory({ usuarioId: ids.users.usuarioInactivo, asesorId: asesor.user.id, label: "AR13" });
  const transactionalFail = await request(`/advisories/${inactivePending.idAsesoria}/resolve`, { token: asesor.token, method: "PATCH", body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: `${PREFIX} fallo transaccional controlado` } });
  const inactiveAfter = await prisma.asesoria.findUnique({ where: { idAsesoria: inactivePending.idAsesoria } });
  addResult("AR13", "Fallo transaccional", "Riesgo de guardado parcial", "Fallo por usuario inactivo no crea servicio ni cambia estado", transactionalFail.status === 400
    && inactiveAfter.estado === "Pendiente"
    && inactiveAfter.idSolicitudServicio === null
    && inactiveAfter.descripcionServicioFinal === null, {
    status: transactionalFail.status,
    advisoryId: inactivePending.idAsesoria,
  });

  const afterUserNotifications = await notificationCountForUser(usuario.user.id, "Asesoria resuelta");
  addResult("AR14", "Notificacion usuario", "No existia evento", "Se notifica al solicitante despues de la transaccion", afterUserNotifications === beforeUserNotifications + 1, { before: beforeUserNotifications, after: afterUserNotifications });

  const adminNotifications = await prisma.notificacion.findMany({
    where: {
      titulo: "Nuevo servicio generado desde asesoria",
      mensaje: { contains: `#${serviceDb.idSolicitudServicio}` },
    },
    orderBy: { idNotificacion: "asc" },
  });
  ids.notifications.push(...adminNotifications.map(item => item.idNotificacion));
  const adminRecipients = [...new Set(adminNotifications.map(item => item.idUsuario))].sort((a, b) => a - b);
  const expectedAdmins = admins.map(item => item.idUsuario).sort((a, b) => a - b);
  addResult("AR15", "Notificacion administradores", "No existia evento", "notificarAdministradoresSeguro crea copia por admin activo", adminNotifications.length === admins.length && JSON.stringify(adminRecipients) === JSON.stringify(expectedAdmins), { admins: expectedAdmins, recipients: adminRecipients });

  const afterTechnicianNotifications = await notificationCountForUser(tecnico.user.id);
  addResult("AR16", "Sin notificacion a tecnicos", "Riesgo de alerta prematura", "No se notifica tecnico hasta asignacion", afterTechnicianNotifications === beforeTechnicianNotifications, { before: beforeTechnicianNotifications, after: afterTechnicianNotifications });

  const userServices = await request("/services", { token: usuario.token });
  const techServices = await request("/services", { token: tecnico.token });
  addResult("AR17", "No regresion de Services", "Riesgo al reutilizar services.service", "Listados de usuario/admin/tecnico siguen respondiendo", userServices.status === 200 && adminServices.status === 200 && techServices.status === 200 && userServices.data.some(item => item.id === serviceDb.idSolicitudServicio), { usuario: userServices.status, admin: adminServices.status, tecnico: techServices.status });

  const regression = {
    health: (await request("/health")).status,
    auth: (await request("/auth/me", { token: usuario.token })).status,
    users: (await request("/users/me", { token: usuario.token })).status,
    appointments: (await request("/appointments", { token: usuario.token })).status,
    payments: (await request("/payments", { token: usuario.token })).status,
    notifications: (await request("/notifications", { token: usuario.token })).status,
    advisories: (await request("/advisories", { token: asesor.token })).status,
    advisorNotification: await notificationCountForUser(asesor.user.id, "Asesoria finalizada"),
  };
  addResult("AR18", "No regresion general", "Riesgo por nuevos endpoints/schema", "Endpoints principales siguen operando", Object.entries(regression).every(([key, value]) => key === "advisorNotification" ? value === beforeAdvisorNotifications + 1 : value === 200), regression);

  const failed = results.filter(item => item.resultadoFinal !== "PASS");
  console.log(`\nADVISORY_RESOLUTION_FLOW_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length > 0) process.exitCode = 1;
}

run()
  .catch(error => {
    console.error("ADVISORY_RESOLUTION_FLOW_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
    await prisma.$disconnect();
  });
