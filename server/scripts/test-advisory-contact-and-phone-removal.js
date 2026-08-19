import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../src/config/prisma.js";

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:4000/api";
const PASSWORD = "123456";
const PREFIX = "PRUEBA_AC";
const SHOULD_START_SERVER = process.argv.includes("--start-server");

let serverProcess = null;
const results = [];
const ids = { users: {}, advisories: [], services: [] };

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

async function ensureUser({ email, nombre, apellido, roleName, telefono = null }) {
  const rol = await role(roleName);
  const contrasenaHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.usuario.upsert({
    where: { correo: email },
    update: { nombre, apellido, contrasenaHash, idRol: rol.idRol, activo: true, telefono },
    create: { correo: email, nombre, apellido, contrasenaHash, idRol: rol.idRol, activo: true, telefono },
    include: { rol: true },
  });
}

async function setupUsers() {
  const admin = await ensureUser({ email: "prueba_ac_admin@futurapp.local", nombre: "Prueba", apellido: "AC Admin", roleName: "Administrador", telefono: "3009000001" });
  const usuarioSinTelefono = await ensureUser({ email: "prueba_ac_usuario_sin_tel@futurapp.local", nombre: "Prueba", apellido: "AC Sin Telefono", roleName: "Usuario", telefono: null });
  const usuarioConTelefono = await ensureUser({ email: "prueba_ac_usuario_con_tel@futurapp.local", nombre: "Prueba", apellido: "AC Con Telefono", roleName: "Usuario", telefono: "3201234567" });
  const tecnico = await ensureUser({ email: "prueba_ac_tecnico@futurapp.local", nombre: "Prueba", apellido: "AC Tecnico", roleName: "Tecnico", telefono: "3109000001" });
  const asesor = await ensureUser({ email: "prueba_ac_asesor@futurapp.local", nombre: "Prueba", apellido: "AC Asesor", roleName: "Asesor", telefono: "3119000001" });
  const asesorAjeno = await ensureUser({ email: "prueba_ac_asesor_ajeno@futurapp.local", nombre: "Prueba", apellido: "AC Ajeno", roleName: "Asesor", telefono: "3129000001" });
  ids.users = {
    admin: admin.idUsuario,
    usuarioSinTelefono: usuarioSinTelefono.idUsuario,
    usuarioConTelefono: usuarioConTelefono.idUsuario,
    tecnico: tecnico.idUsuario,
    asesor: asesor.idUsuario,
    asesorAjeno: asesorAjeno.idUsuario,
  };
}

async function login(email) {
  const response = await request("/auth/login", { method: "POST", body: { email, password: PASSWORD } });
  assert(response.status === 200, `Login fallo ${email}: ${response.status}`);
  return response.data;
}

function futureDate(days = 2) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function firstTipoServicio() {
  const tipo = await prisma.tipoServicio.findFirst({ orderBy: { idTipoServicio: "asc" } });
  assert(tipo, "No hay tipos_servicio.");
  return tipo;
}

async function createAdvisoryByApi(token, { label, withLegacyPhones = false } = {}) {
  const body = {
    descripcionInicial: `${PREFIX} ${label}: computador se apaga durante el trabajo academico.`,
    tipoDispositivo: "Computador",
    fechaContacto: futureDate(3),
    horaContacto: "14:30",
    ...(withLegacyPhones ? { telefonoPrincipal: "+57 300 111 2233", telefonoAlterno: "3011112233" } : {}),
  };
  const response = await request("/advisories", { token, method: "POST", body });
  if (response.data?.id) ids.advisories.push(response.data.id);
  return response;
}

async function assign(adminToken, advisoryId, asesorId = ids.users.asesor) {
  return request(`/advisories/${advisoryId}/assign`, {
    token: adminToken,
    method: "PATCH",
    body: { asesorId },
  });
}

async function run() {
  await startServer();
  await setupUsers();

  const admin = await login("prueba_ac_admin@futurapp.local");
  const usuarioSinTelefono = await login("prueba_ac_usuario_sin_tel@futurapp.local");
  const usuarioConTelefono = await login("prueba_ac_usuario_con_tel@futurapp.local");
  const tecnico = await login("prueba_ac_tecnico@futurapp.local");
  const asesor = await login("prueba_ac_asesor@futurapp.local");
  const asesorAjeno = await login("prueba_ac_asesor_ajeno@futurapp.local");
  const tipo = await firstTipoServicio();

  const userPage = readFileSync(new URL("../../src/pages/UsuarioAsesoriaPage.jsx", import.meta.url), "utf8");
  addResult("AC01", "Formulario sin telefonos", "El formulario tenia campos y payload de telefono", "Se removieron estado, inputs, validaciones y payload de telefono", !/telefonoPrincipal|telefonoAlterno|Telefono principal|Telefono alterno/.test(userPage), {});

  const createNoPhone = await createAdvisoryByApi(usuarioSinTelefono.token, { label: "AC02" });
  const noPhoneDb = await prisma.asesoria.findUnique({ where: { idAsesoria: createNoPhone.data?.id || 0 } });
  addResult("AC02", "Crear asesoria sin telefono", "Backend exigia telefonoPrincipal", "telefonoPrincipal y telefonoAlterno son opcionales", createNoPhone.status === 201
    && noPhoneDb?.telefonoPrincipal === null
    && noPhoneDb?.telefonoAlterno === null
    && noPhoneDb?.estado === "Pendiente", {
    status: createNoPhone.status,
    advisoryId: createNoPhone.data?.id,
    telefonoPrincipal: noPhoneDb?.telefonoPrincipal,
    telefonoAlterno: noPhoneDb?.telefonoAlterno,
  });

  addResult("AC03", "Backend no exige telefono", "POST /api/advisories fallaba sin telefono", "La normalizacion de telefono ya no usa required", createNoPhone.status === 201, { status: createNoPhone.status });

  const legacyCreate = await createAdvisoryByApi(usuarioConTelefono.token, { label: "AC04", withLegacyPhones: true });
  const legacyDb = await prisma.asesoria.findUnique({ where: { idAsesoria: legacyCreate.data?.id || 0 } });
  addResult("AC04", "Compatibilidad con cliente viejo", "Clientes viejos enviaban telefono", "El backend acepta telefonos opcionales y los normaliza si llegan", legacyCreate.status === 201
    && legacyDb?.telefonoPrincipal === "3001112233"
    && legacyDb?.telefonoAlterno === "3011112233", {
    status: legacyCreate.status,
    advisoryId: legacyCreate.data?.id,
    telefonoPrincipal: legacyDb?.telefonoPrincipal,
    telefonoAlterno: legacyDb?.telefonoAlterno,
  });

  const userList = await request("/advisories", { token: usuarioSinTelefono.token });
  addResult("AC05", "Usuario ve sus asesorias", "Riesgo al quitar telefonos del formulario", "Listado role-aware se conserva", userList.status === 200
    && userList.data.some(item => item.id === createNoPhone.data.id)
    && userList.data.every(item => item.usuarioId === usuarioSinTelefono.user.id), {
    status: userList.status,
    count: userList.data?.length,
  });

  const assignResponse = await assign(admin.token, createNoPhone.data.id);
  const assignedDb = await prisma.asesoria.findUnique({ where: { idAsesoria: createNoPhone.data.id } });
  addResult("AC06", "Admin asigna asesor", "Riesgo de regresion en asignacion", "PATCH /api/advisories/:id/assign se mantiene", assignResponse.status === 200
    && assignedDb?.idUsuarioAsesor === asesor.user.id
    && assignedDb?.estado === "Asignada", {
    status: assignResponse.status,
    advisoryId: createNoPhone.data.id,
    advisorId: assignedDb?.idUsuarioAsesor,
  });

  const advisorList = await request("/advisories", { token: asesor.token });
  addResult("AC07", "Asesor ve asesoria asignada", "Riesgo al cambiar contacto", "Listado de asesor conserva filtro por idUsuarioAsesor", advisorList.status === 200
    && advisorList.data.some(item => item.id === createNoPhone.data.id)
    && advisorList.data.every(item => item.asesorId === asesor.user.id), {
    status: advisorList.status,
    count: advisorList.data?.length,
  });

  const advisorPage = readFileSync(new URL("../../src/pages/AsesoriasPage.jsx", import.meta.url), "utf8");
  addResult("AC08", "Boton Chat visible", "No habia accion de chat", "Se agrego accion Chat para asesorias abiertas", /Chat/.test(advisorPage) && /Canal de chat preparado para futura integracion/.test(advisorPage), {});

  const foreignDetail = await request(`/advisories/${createNoPhone.data.id}`, { token: asesorAjeno.token });
  addResult("AC09", "Chat no disponible para asesor ajeno", "Riesgo de asesorias ajenas", "Backend solo permite detalle al asesor asignado", foreignDetail.status === 403, { status: foreignDetail.status });

  addResult("AC10", "Boton Llamar visible", "No habia accion de llamada", "Se agrego accion Llamar con icono phone", /Llamar/.test(advisorPage) && /icon="phone"/.test(advisorPage), {});

  const advisorNoPhoneDetail = await request(`/advisories/${createNoPhone.data.id}`, { token: asesor.token });
  addResult("AC11", "Llamada sin telefono en perfil", "La asesoria pedia telefono propio", "Se usa solicitante.telefono y se muestra aviso si no existe", advisorNoPhoneDetail.status === 200
    && !advisorNoPhoneDetail.data.solicitante?.telefono
    && /El usuario no tiene un numero registrado en su perfil/.test(advisorPage), {
    status: advisorNoPhoneDetail.status,
    telefonoPerfil: advisorNoPhoneDetail.data?.solicitante?.telefono || null,
  });

  const createWithProfilePhone = await createAdvisoryByApi(usuarioConTelefono.token, { label: "AC12" });
  await assign(admin.token, createWithProfilePhone.data.id);
  const advisorPhoneDetail = await request(`/advisories/${createWithProfilePhone.data.id}`, { token: asesor.token });
  addResult("AC12", "Llamada con telefono en perfil", "El telefono salia del formulario de asesoria", "La llamada usa usuarios.telefono con enlace tel:", advisorPhoneDetail.status === 200
    && advisorPhoneDetail.data.solicitante?.telefono === "3201234567"
    && /href=\{`tel:\$\{getProfilePhone/.test(advisorPage), {
    status: advisorPhoneDetail.status,
    telefonoPerfil: advisorPhoneDetail.data?.solicitante?.telefono,
  });

  const resolve = await request(`/advisories/${createNoPhone.data.id}/resolve`, {
    token: asesor.token,
    method: "PATCH",
    body: {
      tipoServicioId: tipo.idTipoServicio,
      descripcionServicioFinal: `${PREFIX} servicio creado luego de contacto preparado`,
    },
  });
  const resolvedDb = await prisma.asesoria.findUnique({
    where: { idAsesoria: createNoPhone.data.id },
    include: {
      solicitudServicio: {
        include: {
          estado: true,
          citas: true,
        },
      },
    },
  });
  if (resolvedDb?.idSolicitudServicio) ids.services.push(resolvedDb.idSolicitudServicio);
  const servicePayments = await prisma.pago.count({ where: { cita: { idSolicitudServicio: resolvedDb?.idSolicitudServicio || -1 } } });
  addResult("AC13", "Resolver asesoria sigue funcionando", "Riesgo por cambios de contacto", "Resolucion crea servicio y relaciona asesoria", resolve.status === 200
    && resolvedDb?.estado === "Asesoria resuelta"
    && resolvedDb?.idSolicitudServicio
    && resolvedDb?.solicitudServicio?.estado?.nombreEstado === "Pendiente"
    && resolvedDb?.solicitudServicio?.citas.length === 0
    && servicePayments === 0, {
    status: resolve.status,
    advisoryId: createNoPhone.data.id,
    serviceId: resolvedDb?.idSolicitudServicio,
  });

  const unresolved = await createAdvisoryByApi(usuarioSinTelefono.token, { label: "AC14" });
  await assign(admin.token, unresolved.data.id);
  const userResolve = await request(`/advisories/${unresolved.data.id}/resolve`, {
    token: usuarioSinTelefono.token,
    method: "PATCH",
    body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: `${PREFIX} usuario no puede completar` },
  });
  addResult("AC14", "Usuario no puede completar asesoria", "Riesgo de permisos frontend-only", "Backend exige rol asesor", userResolve.status === 403, { status: userResolve.status });

  const techResolve = await request(`/advisories/${unresolved.data.id}/resolve`, {
    token: tecnico.token,
    method: "PATCH",
    body: { tipoServicioId: tipo.idTipoServicio, descripcionServicioFinal: `${PREFIX} tecnico no puede completar` },
  });
  addResult("AC15", "Tecnico no puede completar asesoria", "Tecnico no participa en asesorias", "Backend exige rol asesor", techResolve.status === 403, { status: techResolve.status });

  const adminServices = await request("/services", { token: admin.token });
  addResult("AC16", "Admin no rompe servicios", "Riesgo de regresion en services", "Servicio generado aparece en modulo normal de servicios", adminServices.status === 200
    && adminServices.data.some(item => item.id === resolvedDb.idSolicitudServicio), {
    status: adminServices.status,
    serviceId: resolvedDb.idSolicitudServicio,
  });

  const regression = {
    health: (await request("/health")).status,
    auth: (await request("/auth/me", { token: admin.token })).status,
    users: (await request("/users/me", { token: usuarioSinTelefono.token })).status,
    services: (await request("/services", { token: usuarioSinTelefono.token })).status,
    appointments: (await request("/appointments", { token: usuarioSinTelefono.token })).status,
    payments: (await request("/payments", { token: usuarioSinTelefono.token })).status,
    notifications: (await request("/notifications", { token: usuarioSinTelefono.token })).status,
    advisories: (await request("/advisories", { token: asesor.token })).status,
  };
  addResult("AC17", "No regresion", "Riesgo en auth/users/services/appointments/payments/notifications/advisories", "Endpoints principales responden", Object.values(regression).every(status => status === 200), regression);

  const failed = results.filter(item => item.resultadoFinal !== "PASS");
  console.log(`\nADVISORY_CONTACT_PHONE_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length > 0) process.exitCode = 1;
}

run()
  .catch(error => {
    console.error("ADVISORY_CONTACT_PHONE_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
    await prisma.$disconnect();
  });
