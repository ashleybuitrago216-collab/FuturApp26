import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../src/config/prisma.js";

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:4000/api";
const PASSWORD = "123456";
const PREFIX = "PRUEBA_AA";
const SHOULD_START_SERVER = process.argv.includes("--start-server");

let serverProcess = null;
const results = [];
const ids = { users: {}, advisories: [], notifications: [] };

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

function addResult(id, test, passed, details = {}) {
  const row = { id, test, result: passed ? "PASS" : "FAIL", ...details };
  results.push(row);
  console.log(`${row.result} ${id} - ${test}`);
  if (!passed) console.log(JSON.stringify(row, null, 2));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    update: { nombre, apellido, contrasenaHash, idRol: rol.idRol, activo: active },
    create: { correo: email, nombre, apellido, contrasenaHash, idRol: rol.idRol, activo: active },
    include: { rol: true },
  });
}

async function setupUsers() {
  const admin = await ensureUser({ email: "prueba_aa_admin@futurapp.local", nombre: "Prueba", apellido: "AA Admin", roleName: "Administrador" });
  const usuario = await ensureUser({ email: "prueba_aa_usuario@futurapp.local", nombre: "Prueba", apellido: "AA Usuario", roleName: "Usuario" });
  const tecnico = await ensureUser({ email: "prueba_aa_tecnico@futurapp.local", nombre: "Prueba", apellido: "AA Tecnico", roleName: "Tecnico" });
  const asesor = await ensureUser({ email: "prueba_aa_asesor@futurapp.local", nombre: "Prueba", apellido: "AA Asesor", roleName: "Asesor" });
  const asesorB = await ensureUser({ email: "prueba_aa_asesor_b@futurapp.local", nombre: "Prueba", apellido: "AA Asesor B", roleName: "Asesor" });
  const asesorInactivo = await ensureUser({ email: "prueba_aa_asesor_inactivo@futurapp.local", nombre: "Prueba", apellido: "AA Inactivo", roleName: "Asesor", active: false });
  ids.users = {
    admin: admin.idUsuario,
    usuario: usuario.idUsuario,
    tecnico: tecnico.idUsuario,
    asesor: asesor.idUsuario,
    asesorB: asesorB.idUsuario,
    asesorInactivo: asesorInactivo.idUsuario,
  };
}

async function login(email) {
  const response = await request("/auth/login", { method: "POST", body: { email, password: PASSWORD } });
  assert(response.status === 200, `Login fallo ${email}: ${response.status}`);
  return response.data;
}

function futureDate(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00`);
}

async function createAdvisory({ estado = "Pendiente", asesorId = null, serviceId = null, label = "base" } = {}) {
  const advisory = await prisma.asesoria.create({
    data: {
      idUsuarioSolicitante: ids.users.usuario,
      idUsuarioAsesor: asesorId,
      idSolicitudServicio: serviceId,
      fecha: futureDate(2),
      hora: new Date("1970-01-01T11:00:00"),
      estado,
      motivo: "Solicitud de asesoria",
      descripcion: `${PREFIX} ${label}: solicitud creada para validar asignacion administrativa.`,
      tipoDispositivo: "Computador",
      telefonoPrincipal: "3001112233",
      telefonoAlterno: "3011112233",
      fechaCreacion: new Date(),
    },
  });
  ids.advisories.push(advisory.idAsesoria);
  return advisory;
}

async function firstTipoServicio() {
  const tipo = await prisma.tipoServicio.findFirst({ orderBy: { idTipoServicio: "asc" } });
  assert(tipo, "No hay tipos_servicio.");
  return tipo;
}

async function run() {
  await startServer();
  await setupUsers();

  const admin = await login("prueba_aa_admin@futurapp.local");
  const usuario = await login("prueba_aa_usuario@futurapp.local");
  const tecnico = await login("prueba_aa_tecnico@futurapp.local");
  const asesor = await login("prueba_aa_asesor@futurapp.local");

  const pending = await createAdvisory({ label: "AA01" });
  const adminList = await request("/advisories", { token: admin.token });
  addResult("AA01", "Admin lista todas las asesorias", adminList.status === 200 && adminList.data.some(item => item.id === pending.idAsesoria), { status: adminList.status, advisoryId: pending.idAsesoria });

  const userList = await request("/advisories", { token: usuario.token });
  const advisorListBefore = await request("/advisories", { token: asesor.token });
  addResult("AA02", "Listados role-aware se mantienen", userList.status === 200 && userList.data.every(item => item.usuarioId === usuario.user.id) && advisorListBefore.status === 200 && advisorListBefore.data.every(item => item.asesorId === asesor.user.id), { userCount: userList.data?.length, advisorCount: advisorListBefore.data?.length });

  const catalogs = await request("/advisories/catalogs", { token: admin.token });
  addResult("AA03", "Admin obtiene asesores activos con carga", catalogs.status === 200
    && catalogs.data.asesores.some(item => item.id === ids.users.asesor)
    && catalogs.data.asesores.some(item => item.id === ids.users.asesorB)
    && !catalogs.data.asesores.some(item => item.id === ids.users.asesorInactivo), {
    status: catalogs.status,
    advisors: catalogs.data.asesores?.map(item => ({ id: item.id, carga: item.carga })),
  });

  const beforeUserNotifications = await prisma.notificacion.count({ where: { idUsuario: ids.users.usuario, titulo: "Asesor asignado" } });
  const beforeAdvisorNotifications = await prisma.notificacion.count({ where: { idUsuario: ids.users.asesor, titulo: "Nueva asesoria asignada" } });
  const assign = await request(`/advisories/${pending.idAsesoria}/assign`, {
    token: admin.token,
    method: "PATCH",
    body: { asesorId: ids.users.asesor },
  });
  const assignedDb = await prisma.asesoria.findUnique({ where: { idAsesoria: pending.idAsesoria } });
  addResult("AA04", "Admin asigna asesor", assign.status === 200 && assignedDb.idUsuarioAsesor === ids.users.asesor && assignedDb.estado === "Asignada", { status: assign.status, advisoryId: pending.idAsesoria, advisorId: assignedDb.idUsuarioAsesor, estado: assignedDb.estado });

  const advisorListAfter = await request("/advisories", { token: asesor.token });
  const userDetail = await request(`/advisories/${pending.idAsesoria}`, { token: usuario.token });
  addResult("AA05", "Asesor y usuario ven asignacion", advisorListAfter.status === 200
    && advisorListAfter.data.some(item => item.id === pending.idAsesoria)
    && userDetail.status === 200
    && userDetail.data.asesorId === ids.users.asesor, {
    advisorSees: advisorListAfter.data?.some(item => item.id === pending.idAsesoria),
    userAdvisorId: userDetail.data?.asesorId,
  });

  const afterUserNotifications = await prisma.notificacion.count({ where: { idUsuario: ids.users.usuario, titulo: "Asesor asignado" } });
  const afterAdvisorNotifications = await prisma.notificacion.count({ where: { idUsuario: ids.users.asesor, titulo: "Nueva asesoria asignada" } });
  addResult("AA06", "Notificaciones de asignacion", afterUserNotifications === beforeUserNotifications + 1 && afterAdvisorNotifications === beforeAdvisorNotifications + 1, { userBefore: beforeUserNotifications, userAfter: afterUserNotifications, advisorBefore: beforeAdvisorNotifications, advisorAfter: afterAdvisorNotifications });

  const reassign = await request(`/advisories/${pending.idAsesoria}/assign`, {
    token: admin.token,
    method: "PATCH",
    body: { asesorId: ids.users.asesorB },
  });
  const reassignedDb = await prisma.asesoria.findUnique({ where: { idAsesoria: pending.idAsesoria } });
  addResult("AA07", "Admin reasigna asesoria no resuelta", reassign.status === 200 && reassignedDb.idUsuarioAsesor === ids.users.asesorB && reassignedDb.estado === "Asignada", { status: reassign.status, advisorId: reassignedDb.idUsuarioAsesor });

  const wrongRoleUser = await request(`/advisories/${pending.idAsesoria}/assign`, { token: usuario.token, method: "PATCH", body: { asesorId: ids.users.asesor } });
  const wrongRoleTech = await request(`/advisories/${pending.idAsesoria}/assign`, { token: tecnico.token, method: "PATCH", body: { asesorId: ids.users.asesor } });
  const wrongRoleAdvisor = await request(`/advisories/${pending.idAsesoria}/assign`, { token: asesor.token, method: "PATCH", body: { asesorId: ids.users.asesor } });
  addResult("AA08", "Roles incorrectos no asignan", wrongRoleUser.status === 403 && wrongRoleTech.status === 403 && wrongRoleAdvisor.status === 403, { usuario: wrongRoleUser.status, tecnico: wrongRoleTech.status, asesor: wrongRoleAdvisor.status });

  const invalidAdvisorRole = await request(`/advisories/${pending.idAsesoria}/assign`, { token: admin.token, method: "PATCH", body: { asesorId: ids.users.tecnico } });
  const inactiveAdvisor = await request(`/advisories/${pending.idAsesoria}/assign`, { token: admin.token, method: "PATCH", body: { asesorId: ids.users.asesorInactivo } });
  addResult("AA09", "Asesor invalido o inactivo", invalidAdvisorRole.status === 400 && inactiveAdvisor.status === 404, { tecnico: invalidAdvisorRole.status, inactivo: inactiveAdvisor.status });

  const tipo = await firstTipoServicio();
  const service = await prisma.solicitudServicio.create({
    data: {
      idUsuario: ids.users.usuario,
      idTipoServicio: tipo.idTipoServicio,
      descripcionProblema: `${PREFIX} servicio resuelto`,
      idEstado: 2,
      idPrioridad: 2,
    },
  });
  const resolved = await createAdvisory({ estado: "Asesoria resuelta", asesorId: ids.users.asesor, serviceId: service.idSolicitudServicio, label: "AA10" });
  const resolvedAssign = await request(`/advisories/${resolved.idAsesoria}/assign`, { token: admin.token, method: "PATCH", body: { asesorId: ids.users.asesorB } });
  addResult("AA10", "No reasigna asesoria resuelta", resolvedAssign.status === 409, { status: resolvedAssign.status, advisoryId: resolved.idAsesoria });

  const assignedResolve = await request(`/advisories/${pending.idAsesoria}/resolve`, {
    token: await login("prueba_aa_asesor_b@futurapp.local").then(session => session.token),
    method: "PATCH",
    body: {
      tipoServicioId: tipo.idTipoServicio,
      descripcionServicioFinal: `${PREFIX} resolucion desde asignada`,
    },
  });
  addResult("AA11", "Asesor puede resolver estado Asignada", assignedResolve.status === 200, { status: assignedResolve.status, advisoryId: pending.idAsesoria });

  const regression = {
    health: (await request("/health")).status,
    auth: (await request("/auth/me", { token: admin.token })).status,
    services: (await request("/services", { token: admin.token })).status,
    notifications: (await request("/notifications", { token: admin.token })).status,
  };
  addResult("AA12", "No regresion basica", Object.values(regression).every(status => status === 200), regression);

  const failed = results.filter(item => item.result !== "PASS");
  console.log(`\nADVISORY_ADMIN_ASSIGNMENT_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length > 0) process.exitCode = 1;
}

run()
  .catch(error => {
    console.error("ADVISORY_ADMIN_ASSIGNMENT_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
    await prisma.$disconnect();
  });
