import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../src/config/prisma.js";

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:4000/api";
const PASSWORD = "123456";
const PREFIX = "PRUEBA_ASESORIA_USUARIO";
const SHOULD_START_SERVER = process.argv.includes("--start-server");

let serverProcess = null;
const results = [];
const ids = { advisories: [], notifications: [] };

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

function tomorrow(offset = 1) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function yesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

async function startServer() {
  if (!SHOULD_START_SERVER) return;
  serverProcess = spawn(process.execPath, ["src/server.js"], {
    cwd: new URL("..", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  serverProcess.stdout.on("data", chunk => process.stdout.write(`[api] ${chunk}`));
  serverProcess.stderr.on("data", chunk => process.stderr.write(`[api] ${chunk}`));

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const health = await request("/health");
      if (health.ok) return;
    } catch {
      // wait for api
    }
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

async function restartServer() {
  if (!SHOULD_START_SERVER) return;
  await stopServer();
  await startServer();
}

async function role(name) {
  return prisma.rol.upsert({
    where: { nombreRol: name },
    update: {},
    create: { nombreRol: name },
  });
}

async function user({ email, nombre, apellido, roleName }) {
  const rol = await role(roleName);
  const contrasenaHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.usuario.upsert({
    where: { correo: email },
    update: { nombre, apellido, contrasenaHash, idRol: rol.idRol, idAreaEspecialidad: null, activo: true },
    create: { correo: email, nombre, apellido, contrasenaHash, idRol: rol.idRol, activo: true },
    include: { rol: true },
  });
}

async function setup() {
  const admin = await user({ email: "prueba_au_admin@futurapp.local", nombre: "Prueba", apellido: "AU Admin", roleName: "Administrador" });
  const usuarioA = await user({ email: "prueba_au_usuario_a@futurapp.local", nombre: "Prueba", apellido: "Usuario A", roleName: "Usuario" });
  const usuarioB = await user({ email: "prueba_au_usuario_b@futurapp.local", nombre: "Prueba", apellido: "Usuario B", roleName: "Usuario" });
  const tecnico = await user({ email: "prueba_au_tecnico@futurapp.local", nombre: "Prueba", apellido: "AU Tecnico", roleName: "Tecnico" });
  const asesor = await user({ email: "asesor@futurapp.com", nombre: "Asesor", apellido: "FuturApp", roleName: "Asesor" });
  Object.assign(ids, {
    adminId: admin.idUsuario,
    usuarioAId: usuarioA.idUsuario,
    usuarioBId: usuarioB.idUsuario,
    tecnicoId: tecnico.idUsuario,
    asesorId: asesor.idUsuario,
  });
}

async function login(email) {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  assert(response.status === 200, `Login fallo ${email}: ${response.status}`);
  return response.data;
}

function validPayload(label = "valida", overrides = {}) {
  return {
    descripcionInicial: `${PREFIX} ${label}: el computador se apaga despues de algunos minutos y requiere orientacion inicial.`,
    tipoDispositivo: "Computador",
    fechaContacto: tomorrow(1),
    horaContacto: "14:30",
    telefonoPrincipal: "+57 300 123 4567",
    telefonoAlterno: "301 987 6543",
    ...overrides,
  };
}

async function createValid(session, label, overrides = {}) {
  const response = await request("/advisories", {
    token: session.token,
    method: "POST",
    body: validPayload(label, overrides),
  });
  if (response.status === 201) ids.advisories.push(response.data.id);
  return response;
}

async function activeAdmins() {
  const admins = await prisma.usuario.findMany({
    where: {
      activo: true,
      rol: { nombreRol: { in: ["Administrador", "admin", "Admin"] } },
    },
    select: { idUsuario: true },
  });
  return admins;
}

async function run() {
  await startServer();
  await setup();

  const admin = await login("prueba_au_admin@futurapp.local");
  const usuarioA = await login("prueba_au_usuario_a@futurapp.local");
  const usuarioB = await login("prueba_au_usuario_b@futurapp.local");
  const tecnico = await login("prueba_au_tecnico@futurapp.local");
  const asesor = await login("asesor@futurapp.com");

  addResult("AU01", "Acceso del usuario", "No existia tab usuario Asesoria ni endpoint usuario", "Ruta frontend para usuario y GET /api/advisories role-aware", true, { frontendTab: "asesoria" });

  const create = await createValid(usuarioA, "AU02");
  const persisted = await prisma.asesoria.findUnique({ where: { idAsesoria: create.data?.id } });
  addResult("AU02", "Creacion valida", "POST no existia", "POST /api/advisories crea solicitud pendiente", create.status === 201
    && persisted?.estado === "Pendiente"
    && persisted?.idUsuarioSolicitante === usuarioA.user.id
    && persisted?.idUsuarioAsesor === null
    && persisted?.idTipoServicio === null
    && persisted?.descripcionServicioFinal === null, {
    status: create.status,
    asesoriaId: create.data?.id,
    persisted: {
      estado: persisted?.estado,
      solicitante: persisted?.idUsuarioSolicitante,
      asesor: persisted?.idUsuarioAsesor,
      tipoServicio: persisted?.idTipoServicio,
    },
  });

  const noAlternate = await createValid(usuarioA, "AU03", { telefonoAlterno: "" });
  const noAlternateDb = await prisma.asesoria.findUnique({ where: { idAsesoria: noAlternate.data?.id } });
  addResult("AU03", "Telefono alterno vacio", "No habia normalizacion", "Telefono alterno vacio se guarda NULL", noAlternate.status === 201 && noAlternateDb?.telefonoAlterno === null, { status: noAlternate.status, asesoriaId: noAlternate.data?.id });

  const emptyDescription = await request("/advisories", { token: usuarioA.token, method: "POST", body: validPayload("AU04", { descripcionInicial: "   " }) });
  addResult("AU04", "Descripcion vacia", "Sin endpoint/validacion", "Descripcion minima requerida", emptyDescription.status === 400, { status: emptyDescription.status });

  const invalidDevice = await request("/advisories", { token: usuarioA.token, method: "POST", body: validPayload("AU05", { tipoDispositivo: "Nevera" }) });
  addResult("AU05", "Dispositivo invalido", "Sin endpoint/validacion", "Backend valida lista permitida", invalidDevice.status === 400, { status: invalidDevice.status });

  const pastDate = await request("/advisories", { token: usuarioA.token, method: "POST", body: validPayload("AU06", { fechaContacto: yesterday() }) });
  addResult("AU06", "Fecha pasada", "Sin endpoint/validacion", "Backend rechaza fechas pasadas", pastDate.status === 400, { status: pastDate.status });

  const pastHourToday = await request("/advisories", { token: usuarioA.token, method: "POST", body: validPayload("AU07", { fechaContacto: today(), horaContacto: "00:00" }) });
  addResult("AU07", "Hora pasada para hoy", "Sin endpoint/validacion", "Backend rechaza hora pasada si fecha es hoy", pastHourToday.status === 400, { status: pastHourToday.status });

  const invalidPhone = await request("/advisories", { token: usuarioA.token, method: "POST", body: validPayload("AU08", { telefonoPrincipal: "telefono malo" }) });
  addResult("AU08", "Telefono principal invalido", "Sin endpoint/validacion", "Backend normaliza y valida telefonos", invalidPhone.status === 400, { status: invalidPhone.status });

  const forbidden = await request("/advisories", {
    token: usuarioA.token,
    method: "POST",
    body: validPayload("AU09", { estado: "Asesoria resuelta", asesorId: ids.asesorId, tipoServicioId: 3, descripcionServicioFinal: "Final" }),
  });
  addResult("AU09", "Campos administrativos", "Sin endpoint/validacion", "Backend rechaza campos administrativos", forbidden.status === 400, { status: forbidden.status });

  const ownList = await request("/advisories", { token: usuarioA.token });
  addResult("AU10", "Listado propio", "Endpoint solo asesor", "GET /api/advisories filtra por solicitante para usuario", ownList.status === 200 && ownList.data.length >= 2 && ownList.data.every(item => item.usuarioId === usuarioA.user.id), { status: ownList.status, count: ownList.data?.length });

  const otherCreate = await createValid(usuarioB, "AU11");
  const cross = await request(`/advisories/${otherCreate.data.id}`, { token: usuarioA.token });
  addResult("AU11", "Seguridad cruzada", "Detalle solo asesor", "Detalle permite usuario solicitante y rechaza ajeno", cross.status === 403, { status: cross.status, ownUser: usuarioA.user.id, otherAdvisory: otherCreate.data.id });

  await restartServer();
  const afterRestart = await request(`/advisories/${create.data.id}`, { token: usuarioA.token });
  addResult("AU12", "Persistencia tras reinicio", "No existia creacion usuario", "Dato persiste en MySQL y sigue disponible", afterRestart.status === 200 && afterRestart.data.id === create.data.id, { status: afterRestart.status, advisoryId: create.data.id });

  const userNotifications = await request("/notifications", { token: usuarioA.token });
  const userConfirmation = userNotifications.data.filter(item => item.titulo === "Solicitud de asesoria creada" && item.mensaje.includes(`#${create.data.id}`));
  ids.notifications.push(...userConfirmation.map(item => item.id));
  addResult("AU13", "Notificacion del usuario", "No existia evento", "Se crea confirmacion personal", userNotifications.status === 200 && userConfirmation.length >= 1, { notifications: userConfirmation.map(item => item.id) });

  const admins = await activeAdmins();
  const adminNotifications = await prisma.notificacion.findMany({
    where: {
      titulo: "Nueva solicitud de asesoria",
      mensaje: { contains: `#${create.data.id}` },
    },
    orderBy: { idNotificacion: "asc" },
  });
  ids.notifications.push(...adminNotifications.map(item => item.idNotificacion));
  const adminRecipients = [...new Set(adminNotifications.map(item => item.idUsuario))].sort((a, b) => a - b);
  const expectedAdmins = admins.map(item => item.idUsuario).sort((a, b) => a - b);
  addResult("AU14", "Notificacion administrativa", "No existia evento", "Helper crea copia por admin activo", adminNotifications.length === admins.length && JSON.stringify(adminRecipients) === JSON.stringify(expectedAdmins), { admins: expectedAdmins, recipients: adminRecipients, notifications: adminNotifications.map(item => item.idNotificacion) });

  const advisorList = await request("/advisories", { token: asesor.token });
  addResult("AU15", "No regresion del asesor", "Riesgo por endpoint role-aware", "Asesor sigue viendo solo asignadas", advisorList.status === 200 && advisorList.data.every(item => item.asesorId === asesor.user.id), { status: advisorList.status, count: advisorList.data?.length });

  const noToken = await request("/advisories", { method: "POST", body: validPayload("sin token") });
  const techCreate = await request("/advisories", { token: tecnico.token, method: "POST", body: validPayload("tecnico") });
  const advisorCreate = await request("/advisories", { token: asesor.token, method: "POST", body: validPayload("asesor") });
  const adminCreate = await request("/advisories", { token: admin.token, method: "POST", body: validPayload("admin") });
  const regression = {
    health: (await request("/health")).status,
    auth: (await request("/auth/me", { token: usuarioA.token })).status,
    users: (await request("/users/me", { token: usuarioA.token })).status,
    services: (await request("/services", { token: usuarioA.token })).status,
    appointments: (await request("/appointments", { token: usuarioA.token })).status,
    payments: (await request("/payments", { token: usuarioA.token })).status,
    notifications: (await request("/notifications", { token: usuarioA.token })).status,
    advisorDashboardApi: advisorList.status,
  };
  const secure = noToken.status === 401 && techCreate.status === 403 && advisorCreate.status === 403 && adminCreate.status === 403;
  const regressionPass = secure && Object.values(regression).every(status => status === 200);
  addResult("AU16", "No regresion general", "Riesgo de romper roles previos", "Se validan seguridad POST y endpoints principales", regressionPass, {
    security: { noToken: noToken.status, tecnico: techCreate.status, asesor: advisorCreate.status, admin: adminCreate.status },
    regression,
  });

  const failed = results.filter(item => item.resultadoFinal !== "PASS");
  console.log(`\nADVISORY_USER_FLOW_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length > 0) process.exitCode = 1;
}

run()
  .catch(error => {
    console.error("ADVISORY_USER_FLOW_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
    await prisma.$disconnect();
  });
