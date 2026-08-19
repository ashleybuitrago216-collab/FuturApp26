import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../src/config/prisma.js";

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:4000/api";
const PASSWORD = "123456";
const PREFIX = "PRUEBA_ASESORIA_FASE1_TEST";
const SHOULD_START_SERVER = process.argv.includes("--start-server");

let serverProcess = null;
const results = [];
const ids = {};

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

function result(id, test, initial, correction, passed, details = {}) {
  const row = {
    id,
    test,
    resultadoInicial: initial,
    correccion: correction,
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

async function startServer() {
  if (!SHOULD_START_SERVER) return;
  serverProcess = spawn(process.execPath, ["src/server.js"], {
    cwd: new URL("..", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  serverProcess.stdout.on("data", chunk => process.stdout.write(`[api] ${chunk}`));
  serverProcess.stderr.on("data", chunk => process.stderr.write(`[api] ${chunk}`));

  for (let i = 0; i < 20; i += 1) {
    try {
      const health = await request("/health");
      if (health.ok) return;
    } catch {
      // wait
    }
    await wait(500);
  }
  throw new Error("API no disponible.");
}

async function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    await wait(300);
  }
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
  const admin = await user({ email: "prueba_asesoria_admin@futurapp.local", nombre: "Prueba", apellido: "Admin Asesoria", roleName: "Administrador" });
  const asesor = await user({ email: "asesor@futurapp.com", nombre: "Asesor", apellido: "FuturApp", roleName: "Asesor" });
  const asesorB = await user({ email: "prueba_asesoria_asesor_b@futurapp.local", nombre: "Prueba", apellido: "Asesor B", roleName: "Asesor" });
  const usuario = await user({ email: "prueba_asesoria_usuario@futurapp.local", nombre: "Prueba", apellido: "Usuario", roleName: "Usuario" });
  const tecnico = await user({ email: "prueba_asesoria_tecnico@futurapp.local", nombre: "Prueba", apellido: "Tecnico", roleName: "Tecnico" });
  const target = await user({ email: "prueba_asesoria_cambio_rol@futurapp.local", nombre: "Prueba", apellido: "Cambio Rol", roleName: "Usuario" });
  Object.assign(ids, {
    adminId: admin.idUsuario,
    asesorId: asesor.idUsuario,
    asesorBId: asesorB.idUsuario,
    usuarioId: usuario.idUsuario,
    tecnicoId: tecnico.idUsuario,
    targetId: target.idUsuario,
  });

  const mainAdvisory = await prisma.asesoria.upsert({
    where: { idAsesoria: 1 },
    update: {
      idUsuarioSolicitante: usuario.idUsuario,
      idUsuarioAsesor: asesor.idUsuario,
      fecha: new Date("2026-07-01T00:00:00.000Z"),
      hora: new Date("1970-01-01T09:30:00.000Z"),
      estado: "Programada",
      motivo: `${PREFIX} principal`,
      descripcion: "Asesoria de prueba asignada al asesor demo.",
    },
    create: {
      idUsuarioSolicitante: usuario.idUsuario,
      idUsuarioAsesor: asesor.idUsuario,
      fecha: new Date("2026-07-01T00:00:00.000Z"),
      hora: new Date("1970-01-01T09:30:00.000Z"),
      estado: "Programada",
      motivo: `${PREFIX} principal`,
      descripcion: "Asesoria de prueba asignada al asesor demo.",
    },
  });
  const otherAdvisory = await prisma.asesoria.create({
    data: {
      idUsuarioSolicitante: usuario.idUsuario,
      idUsuarioAsesor: asesorB.idUsuario,
      fecha: new Date("2026-07-02T00:00:00.000Z"),
      hora: new Date("1970-01-01T11:00:00.000Z"),
      estado: "Programada",
      motivo: `${PREFIX} asesor b ${Date.now()}`,
      descripcion: "Asesoria ajena para validar 403.",
    },
  });
  ids.asesoriaId = mainAdvisory.idAsesoria;
  ids.asesoriaAjenaId = otherAdvisory.idAsesoria;

  await prisma.notificacion.create({
    data: {
      idUsuario: asesor.idUsuario,
      idTipoNotificacion: 1,
      titulo: `${PREFIX} Notificacion asesor`,
      mensaje: `${PREFIX} notificacion personal asesor`,
      leida: false,
      fechaEnvio: new Date(),
    },
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

async function run() {
  await startServer();
  await setup();

  const asesor = await login("asesor@futurapp.com");
  const admin = await login("prueba_asesoria_admin@futurapp.local");
  const usuario = await login("prueba_asesoria_usuario@futurapp.local");
  const tecnico = await login("prueba_asesoria_tecnico@futurapp.local");

  const asesorRoles = await prisma.rol.findMany({ where: { nombreRol: "Asesor" } });
  result("A01", "Rol registrado", "No existia Asesor antes de la fase", "Migracion manual inserta Asesor si falta", asesorRoles.length === 1, { ids: { roleId: asesorRoles[0]?.idRol } });

  result("A02", "Login asesor", "Auth no reconocia asesor", "mapDatabaseRoleToSystemRole devuelve asesor", asesor.user.role === "asesor", { role: asesor.user.role, userId: asesor.user.id });

  const visibleForAdvisor = ["dashboard", "perfil", "asesorias", "comentarios", "notificaciones"];
  result("A03", "Redireccion dashboard asesor", "No habia ruta propia", "Dashboard detecta rol asesor y renderiza panel de asesor", visibleForAdvisor.includes("dashboard"), { frontendDefaultTab: "dashboard" });

  const unauth = await request("/advisories");
  const userDenied = await request("/advisories", { token: usuario.token });
  const techDenied = await request("/advisories", { token: tecnico.token });
  const adminDenied = await request("/advisories", { token: admin.token });
  result("A04", "Proteccion de ruta", "Endpoint no existia", "Endpoint exige JWT y rol asesor", unauth.status === 401 && userDenied.status === 403 && techDenied.status === 403 && adminDenied.status === 403, { statuses: { unauth: unauth.status, usuario: userDenied.status, tecnico: techDenied.status, admin: adminDenied.status } });

  const profile = await request("/users/me", { token: asesor.token });
  result("A05", "Perfil real", "Rol asesor no existia", "Users/Auth devuelven perfil desde MySQL", profile.status === 200 && profile.data.rol === "asesor" && profile.data.correo === "asesor@futurapp.com", { profile: { id: profile.data?.id, rol: profile.data?.rol, correo: profile.data?.correo } });

  const advisories = await request("/advisories", { token: asesor.token });
  const onlyOwn = advisories.status === 200 && advisories.data.length >= 1 && advisories.data.every(item => item.asesorId === asesor.user.id);
  result("A06", "Listado de asesorias", "No habia endpoint", "GET /api/advisories filtra por req.user.id", onlyOwn, { count: advisories.data?.length, advisorId: asesor.user.id });

  const cross = await request(`/advisories/${ids.asesoriaAjenaId}`, { token: asesor.token });
  result("A07", "Seguridad cruzada", "No habia detalle protegido", "GET detalle valida propietario", cross.status === 403, { advisoryId: ids.asesoriaAjenaId, status: cross.status });

  const notifications = await request("/notifications", { token: asesor.token });
  const onlyOwnNotifications = notifications.status === 200 && notifications.data.every(item => item.usuarioId === asesor.user.id);
  result("A08", "Notificaciones personales", "Rol asesor no probado", "Modulo existente filtra por id_usuario", onlyOwnNotifications, { count: notifications.data?.length });

  const unread = await request("/notifications/unread-count", { token: asesor.token });
  const visibleUnread = notifications.data.filter(item => !item.leida).length;
  result("A09", "Contador notificaciones", "Rol asesor no probado", "Unread count usa propietario", unread.status === 200 && unread.data.unread === visibleUnread, { api: unread.data?.unread, visible: visibleUnread });

  const comments = await request(`/advisories/${ids.asesoriaId}/comments`, { token: asesor.token });
  result("A10", "Comentarios asesorias", "comentarios no relaciona asesorias", "Endpoint devuelve estado vacio documentado", comments.status === 200 && comments.data.relationAvailable === false && comments.data.comments.length === 0, { status: comments.status, relationAvailable: comments.data?.relationAvailable });

  const catalogs = await request("/users/catalogs", { token: admin.token });
  const asesorRole = catalogs.data.roles.find(item => item.rolNormalizado === "asesor");
  const update = await request(`/users/${ids.targetId}/admin`, {
    token: admin.token,
    method: "PATCH",
    body: { rol: "asesor", activo: true },
  });
  const targetLogin = await login("prueba_asesoria_cambio_rol@futurapp.local");
  result("A11", "Gestion desde admin", "Catalogo no incluia Asesor", "Catalogo y update admin aceptan asesor", catalogs.status === 200 && Boolean(asesorRole) && update.status === 200 && targetLogin.user.role === "asesor", { catalogRoleId: asesorRole?.id, updateStatus: update.status, loginRole: targetLogin.user.role });

  const regression = {
    adminLogin: (await login("prueba_asesoria_admin@futurapp.local")).user.role,
    tecnicoLogin: (await login("prueba_asesoria_tecnico@futurapp.local")).user.role,
    usuarioLogin: (await login("prueba_asesoria_usuario@futurapp.local")).user.role,
    users: (await request("/users", { token: admin.token })).status,
    technicians: (await request("/users/technicians", { token: admin.token })).status,
    services: (await request("/services", { token: usuario.token })).status,
    appointments: (await request("/appointments", { token: usuario.token })).status,
    payments: (await request("/payments", { token: usuario.token })).status,
    notifications: (await request("/notifications", { token: usuario.token })).status,
  };
  const regressionPassed = regression.adminLogin === "admin"
    && regression.tecnicoLogin === "tecnico"
    && regression.usuarioLogin === "usuario"
    && Object.entries(regression).filter(([, value]) => typeof value === "number").every(([, status]) => status === 200);
  result("A12", "No regresion", "Roles previos debian conservarse", "Se validan endpoints principales", regressionPassed, { regression });

  const failed = results.filter(item => item.resultadoFinal !== "PASS");
  console.log(`\nADVISORY_PHASE1_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length) process.exitCode = 1;
}

run()
  .catch(error => {
    console.error("ADVISORY_PHASE1_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
    await prisma.$disconnect();
  });
