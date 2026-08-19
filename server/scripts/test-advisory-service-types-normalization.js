import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../src/config/prisma.js";

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:4000/api";
const PASSWORD = "123456";
const PREFIX = "PRUEBA_ST";
const SHOULD_START_SERVER = process.argv.includes("--start-server");

let serverProcess = null;
const results = [];
const ids = { users: {}, advisories: [], services: [], serviceTypes: {} };

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

function normalizeName(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function isAdvisoryLike(tipo) {
  return ["asesoria", "asesorias", "orientacion", "consulta"].includes(normalizeName(tipo?.nombreServicio || tipo?.nombre));
}

function futureDate(days = 2) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
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

async function firstAreaEspecialidad() {
  let area = await prisma.areaEspecialidad.findFirst({ orderBy: { idAreaEspecialidad: "asc" } });
  if (!area) {
    area = await prisma.areaEspecialidad.create({
      data: { nombreAreaEspecialidad: `${PREFIX} Soporte tecnico` },
    });
  }
  return area;
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
  const area = await firstAreaEspecialidad();
  const admin = await ensureUser({ email: "prueba_st_admin@futurapp.local", nombre: "Prueba", apellido: "ST Admin", roleName: "Administrador" });
  const usuario = await ensureUser({ email: "prueba_st_usuario@futurapp.local", nombre: "Prueba", apellido: "ST Usuario", roleName: "Usuario" });
  const tecnico = await ensureUser({ email: "prueba_st_tecnico@futurapp.local", nombre: "Prueba", apellido: "ST Tecnico", roleName: "Tecnico", areaId: area.idAreaEspecialidad });
  const asesor = await ensureUser({ email: "prueba_st_asesor@futurapp.local", nombre: "Prueba", apellido: "ST Asesor", roleName: "Asesor" });
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

async function ensureAdvisoryType() {
  const tipos = await prisma.tipoServicio.findMany();
  let advisoryType = tipos.find(isAdvisoryLike);
  if (!advisoryType) {
    advisoryType = await prisma.tipoServicio.create({
      data: {
        nombreServicio: "Asesoría",
        descripcionServicio: "Tipo no tecnico usado para validar normalizacion de asesorias.",
        costo: 0,
      },
    });
  }
  ids.serviceTypes.advisory = advisoryType.idTipoServicio;
  return advisoryType;
}

async function createAssignedAdvisory(label = "base") {
  const advisory = await prisma.asesoria.create({
    data: {
      idUsuarioSolicitante: ids.users.usuario,
      idUsuarioAsesor: ids.users.asesor,
      fecha: new Date(`${futureDate(3)}T00:00:00`),
      hora: new Date("1970-01-01T10:30:00"),
      estado: "Asignada",
      motivo: "Solicitud de asesoria",
      descripcion: `${PREFIX} ${label}: equipo requiere clasificacion tecnica.`,
      tipoDispositivo: "Computador",
      fechaCreacion: new Date(),
    },
  });
  ids.advisories.push(advisory.idAsesoria);
  return advisory;
}

async function run() {
  await startServer();
  await setupUsers();
  const advisoryType = await ensureAdvisoryType();

  const admin = await login("prueba_st_admin@futurapp.local");
  const usuario = await login("prueba_st_usuario@futurapp.local");
  const tecnico = await login("prueba_st_tecnico@futurapp.local");
  const asesor = await login("prueba_st_asesor@futurapp.local");

  const advisorCatalog = await request("/advisories/catalogs", { token: asesor.token });
  const advisorTypes = advisorCatalog.data?.tiposServicio || [];
  const technicalType = advisorTypes.find(tipo => !isAdvisoryLike(tipo));
  ids.serviceTypes.technical = technicalType?.id;
  addResult("ST01", "Catalogo del asesor", "Catalogo devolvia todos los tipos", "Backend filtra tipos no tecnicos para rol asesor", advisorCatalog.status === 200
    && advisorTypes.length > 0
    && !advisorTypes.some(isAdvisoryLike)
    && Boolean(technicalType), {
    status: advisorCatalog.status,
    advisorTypes: advisorTypes.map(tipo => tipo.nombre),
    advisoryTypeId: advisoryType.idTipoServicio,
  });

  const adminCatalog = await request("/advisories/catalogs", { token: admin.token });
  addResult("ST02", "Catalogo admin", "Admin necesitaba asesores y datos de catalogo", "Admin conserva asesores y puede ver catalogo completo", adminCatalog.status === 200
    && Array.isArray(adminCatalog.data?.asesores)
    && adminCatalog.data.asesores.some(item => item.id === ids.users.asesor)
    && adminCatalog.data.tiposServicio.some(item => item.id === advisoryType.idTipoServicio), {
    status: adminCatalog.status,
    adminTypes: adminCatalog.data?.tiposServicio?.map(tipo => tipo.nombre),
  });

  const validAdvisory = await createAssignedAdvisory("ST03");
  const validResolve = await request(`/advisories/${validAdvisory.idAsesoria}/resolve`, {
    token: asesor.token,
    method: "PATCH",
    body: {
      tipoServicioId: technicalType.id,
      descripcionServicioFinal: `${PREFIX} servicio tecnico definido por asesor`,
    },
  });
  const validDb = await prisma.asesoria.findUnique({
    where: { idAsesoria: validAdvisory.idAsesoria },
    include: { solicitudServicio: true },
  });
  if (validDb?.idSolicitudServicio) ids.services.push(validDb.idSolicitudServicio);
  addResult("ST03", "Resolver con tipo tecnico valido", "Resolve solo validaba existencia del tipo", "Resolve exige tipo tecnico permitido y guarda ID", validResolve.status === 200
    && validDb?.idTipoServicio === technicalType.id
    && validDb?.solicitudServicio?.idTipoServicio === technicalType.id, {
    status: validResolve.status,
    advisoryId: validAdvisory.idAsesoria,
    serviceId: validDb?.idSolicitudServicio,
    tipoServicioId: validDb?.solicitudServicio?.idTipoServicio,
  });

  const advisoryTypeCase = await createAssignedAdvisory("ST04");
  const beforeServices = await prisma.solicitudServicio.count();
  const invalidAdvisoryResolve = await request(`/advisories/${advisoryTypeCase.idAsesoria}/resolve`, {
    token: asesor.token,
    method: "PATCH",
    body: {
      tipoServicioId: advisoryType.idTipoServicio,
      descripcionServicioFinal: `${PREFIX} intento con asesoria no tecnica`,
    },
  });
  const invalidAdvisoryAfter = await prisma.asesoria.findUnique({ where: { idAsesoria: advisoryTypeCase.idAsesoria } });
  const afterServices = await prisma.solicitudServicio.count();
  addResult("ST04", "Intentar resolver con tipo Asesoria", "Backend aceptaba cualquier tipo existente", "Backend rechaza Asesoria como servicio tecnico", invalidAdvisoryResolve.status === 400
    && invalidAdvisoryAfter.idSolicitudServicio === null
    && beforeServices === afterServices, {
    status: invalidAdvisoryResolve.status,
    advisoryTypeId: advisoryType.idTipoServicio,
    servicesBefore: beforeServices,
    servicesAfter: afterServices,
  });

  const noTypeCase = await createAssignedAdvisory("ST05");
  const noType = await request(`/advisories/${noTypeCase.idAsesoria}/resolve`, {
    token: asesor.token,
    method: "PATCH",
    body: { descripcionServicioFinal: `${PREFIX} sin tipo tecnico` },
  });
  addResult("ST05", "Resolver sin tipo", "Riesgo de servicio sin tipo", "tipoServicioId obligatorio", noType.status === 400, { status: noType.status });

  const missingType = await request(`/advisories/${noTypeCase.idAsesoria}/resolve`, {
    token: asesor.token,
    method: "PATCH",
    body: { tipoServicioId: 999999, descripcionServicioFinal: `${PREFIX} tipo inexistente` },
  });
  addResult("ST06", "Tipo inexistente", "Riesgo de ID invalido", "Backend consulta tipos_servicio y responde 404", missingType.status === 404, { status: missingType.status });

  const assignTechnician = await request(`/services/${validDb.idSolicitudServicio}`, {
    token: admin.token,
    method: "PATCH",
    body: { technicianId: ids.users.tecnico, monto: 25000 },
  });
  const techServices = await request("/services", { token: tecnico.token });
  const techService = techServices.data?.find(item => item.id === validDb.idSolicitudServicio);
  addResult("ST07", "Tecnico visualiza tipo", "El tecnico podia recibir servicio sin categoria clara", "Servicio conserva tipo definido por asesor y tecnico lo ve", assignTechnician.status === 200
    && techServices.status === 200
    && techService?.serviceTypeId === technicalType.id, {
    assignStatus: assignTechnician.status,
    techListStatus: techServices.status,
    serviceType: techService?.serviceType,
    serviceTypeId: techService?.serviceTypeId,
  });

  const techChangeType = await request(`/services/${validDb.idSolicitudServicio}`, {
    token: tecnico.token,
    method: "PATCH",
    body: { serviceType: "Asesoría" },
  });
  addResult("ST08", "Tecnico no puede cambiar tipo", "UI tecnica tenia selector y backend rechazaba genericamente", "UI queda solo lectura y backend mantiene 403", techChangeType.status === 403, { status: techChangeType.status });

  const adminServices = await request("/services", { token: admin.token });
  const adminService = adminServices.data?.find(item => item.id === validDb.idSolicitudServicio);
  addResult("ST09", "Admin ve tipo para asignar tecnico", "Admin necesitaba ver categoria tecnica", "Mapper expone tipo y origen de asesoria", adminServices.status === 200
    && adminService?.serviceTypeId === technicalType.id
    && adminService?.advisoryOriginId === validAdvisory.idAsesoria, {
    status: adminServices.status,
    serviceType: adminService?.serviceType,
    advisoryOriginId: adminService?.advisoryOriginId,
  });

  const adminChangeType = await request(`/services/${validDb.idSolicitudServicio}`, {
    token: admin.token,
    method: "PATCH",
    body: { serviceType: "Instalación de SO" },
  });
  const afterAdminChange = await prisma.solicitudServicio.findUnique({ where: { idSolicitudServicio: validDb.idSolicitudServicio } });
  addResult("ST10", "Admin no cambia tipo en servicio generado desde asesoria", "Admin podia cambiar tipo sin revisar origen", "Backend bloquea cambio de tipo si existe asesoriaOrigen", adminChangeType.status === 400
    && afterAdminChange.idTipoServicio === technicalType.id, {
    status: adminChangeType.status,
    tipoServicioId: afterAdminChange.idTipoServicio,
  });

  const relationCheck = await prisma.asesoria.findUnique({
    where: { idAsesoria: validAdvisory.idAsesoria },
    include: { solicitudServicio: true },
  });
  addResult("ST11", "Servicio generado conserva relacion con asesoria", "Riesgo de servicio suelto o sin tipo", "Relaciones por ID se mantienen", relationCheck.idSolicitudServicio === validDb.idSolicitudServicio
    && relationCheck.solicitudServicio.idTipoServicio === technicalType.id, {
    advisoryId: relationCheck.idAsesoria,
    serviceId: relationCheck.idSolicitudServicio,
    serviceTypeId: relationCheck.solicitudServicio?.idTipoServicio,
  });

  const createdByUser = await request("/advisories", {
    token: usuario.token,
    method: "POST",
    body: {
      descripcionInicial: `${PREFIX} flujo completo de asesoria desde usuario`,
      tipoDispositivo: "Computador",
      fechaContacto: futureDate(4),
      horaContacto: "15:30",
    },
  });
  const createdId = createdByUser.data?.id;
  if (createdId) ids.advisories.push(createdId);
  const assigned = await request(`/advisories/${createdId}/assign`, {
    token: admin.token,
    method: "PATCH",
    body: { asesorId: ids.users.asesor },
  });
  const resolved = await request(`/advisories/${createdId}/resolve`, {
    token: asesor.token,
    method: "PATCH",
    body: {
      tipoServicioId: technicalType.id,
      descripcionServicioFinal: `${PREFIX} no regresion de flujo asesorias`,
    },
  });
  addResult("ST12", "No regresion de asesoria", "Riesgo al filtrar catalogo", "Usuario crea, admin asigna y asesor resuelve", createdByUser.status === 201 && assigned.status === 200 && resolved.status === 200, {
    create: createdByUser.status,
    assign: assigned.status,
    resolve: resolved.status,
    advisoryId: createdId,
  });

  const serviceFromFlow = resolved.data?.service?.id || resolved.data?.servicio?.id;
  if (serviceFromFlow) ids.services.push(serviceFromFlow);
  const adminAssignFlow = await request(`/services/${serviceFromFlow}`, {
    token: admin.token,
    method: "PATCH",
    body: { technicianId: ids.users.tecnico, monto: 30000 },
  });
  addResult("ST13", "No regresion de servicios", "Riesgo de romper asignacion tecnico/monto", "Admin asigna tecnico y monto sin cambiar tipo", adminAssignFlow.status === 200
    && (adminAssignFlow.data?.technicianId === ids.users.tecnico || adminAssignFlow.data?.tecnicoId === ids.users.tecnico)
    && (adminAssignFlow.data?.paymentId || adminAssignFlow.data?.pagoId), {
    status: adminAssignFlow.status,
    serviceId: serviceFromFlow,
    paymentId: adminAssignFlow.data?.paymentId || adminAssignFlow.data?.pagoId,
  });

  const regression = {
    health: (await request("/health")).status,
    auth: (await request("/auth/me", { token: admin.token })).status,
    users: (await request("/users/me", { token: usuario.token })).status,
    notifications: (await request("/notifications", { token: usuario.token })).status,
    payments: (await request("/payments", { token: usuario.token })).status,
    appointments: (await request("/appointments", { token: usuario.token })).status,
  };
  addResult("ST14", "No regresion general", "Riesgo en modulos principales", "Endpoints principales siguen respondiendo", Object.values(regression).every(status => status === 200), regression);

  const failed = results.filter(item => item.resultadoFinal !== "PASS");
  console.log(`\nADVISORY_SERVICE_TYPES_NORMALIZATION_RESULT=${JSON.stringify({ ids, results, failed: failed.map(item => item.id) }, null, 2)}`);
  if (failed.length > 0) process.exitCode = 1;
}

run()
  .catch(error => {
    console.error("ADVISORY_SERVICE_TYPES_NORMALIZATION_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
    await prisma.$disconnect();
  });
