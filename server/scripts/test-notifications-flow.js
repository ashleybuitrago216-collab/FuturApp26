import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../src/config/prisma.js";

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:4000/api";
const PREFIX = "PRUEBA_NOTIFICACIONES_";
const PASSWORD = "123456";
const SHOULD_START_SERVER = process.argv.includes("--start-server");

const testUsers = {
  adminA: { email: "prueba_notificaciones_admin_a@futurapp.local", name: "PRUEBA_NOTIFICACIONES Admin A", role: "Administrador" },
  adminB: { email: "prueba_notificaciones_admin_b@futurapp.local", name: "PRUEBA_NOTIFICACIONES Admin B", role: "Administrador" },
  usuario: { email: "prueba_notificaciones_usuario@futurapp.local", name: "PRUEBA_NOTIFICACIONES Usuario", role: "Usuario" },
  tecnico: { email: "prueba_notificaciones_tecnico@futurapp.local", name: "PRUEBA_NOTIFICACIONES Tecnico", role: "Tecnico" },
};

const results = [];
const created = {
  users: {},
  services: [],
  appointments: [],
  payments: [],
  notifications: [],
};

let serverProcess = null;

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function roleCanonical(roleName) {
  const normalized = normalizeText(roleName);
  if (normalized === "administrador" || normalized === "admin") return "admin";
  if (normalized === "tecnico") return "tecnico";
  if (normalized === "usuario") return "usuario";
  return null;
}

function splitName(value) {
  const parts = String(value).split(" ");
  return {
    nombre: parts.shift(),
    apellido: parts.join(" ") || null,
  };
}

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

function addResult(id, event, payload) {
  const row = { id, event, ...payload };
  results.push(row);
  const state = row.finalResult === "PASS" || row.finalResult === "NO_EJECUTABLE" ? row.finalResult : "FAIL";
  console.log(`${state} ${id} - ${event}`);
  if (state === "FAIL") {
    console.log(JSON.stringify(row, null, 2));
  }
  return row;
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

async function startServerIfRequested() {
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
      // Wait until Express is listening.
    }
    await wait(500);
  }
  throw new Error("No se pudo levantar la API para pruebas.");
}

async function stopServerIfStarted() {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill();
  await wait(300);
}

async function ensureRole(name) {
  return prisma.rol.upsert({
    where: { nombreRol: name },
    update: {},
    create: { nombreRol: name },
  });
}

async function ensureArea() {
  return prisma.areaEspecialidad.upsert({
    where: { nombreAreaEspecialidad: `${PREFIX}Soporte` },
    update: {},
    create: { nombreAreaEspecialidad: `${PREFIX}Soporte` },
  });
}

async function ensureUser(key, config, roles, area) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const { nombre, apellido } = splitName(config.name);
  const role = roles[config.role];
  const isTechnician = config.role === "Tecnico";

  const user = await prisma.usuario.upsert({
    where: { correo: config.email },
    update: {
      nombre,
      apellido,
      contrasenaHash: passwordHash,
      idRol: role.idRol,
      idAreaEspecialidad: isTechnician ? area.idAreaEspecialidad : null,
      activo: true,
    },
    create: {
      nombre,
      apellido,
      correo: config.email,
      contrasenaHash: passwordHash,
      idRol: role.idRol,
      idAreaEspecialidad: isTechnician ? area.idAreaEspecialidad : null,
      activo: true,
    },
    include: { rol: true },
  });

  created.users[key] = user.idUsuario;
  return user;
}

async function setupUsers() {
  const roles = {
    Administrador: await ensureRole("Administrador"),
    Usuario: await ensureRole("Usuario"),
    Tecnico: await ensureRole("Tecnico"),
  };
  const area = await ensureArea();
  const users = {};
  for (const [key, config] of Object.entries(testUsers)) {
    users[key] = await ensureUser(key, config, roles, area);
  }
  return users;
}

async function loginUsers() {
  const sessions = {};
  for (const [key, config] of Object.entries(testUsers)) {
    const response = await request("/auth/login", {
      method: "POST",
      body: { email: config.email, password: PASSWORD },
    });
    assertCondition(response.status === 200, `Login fallo para ${key}: ${response.status}`);
    sessions[key] = response.data;
  }
  return sessions;
}

async function activeAdmins() {
  const users = await prisma.usuario.findMany({
    where: { activo: true },
    include: { rol: true },
    orderBy: { idUsuario: "asc" },
  });
  return users.filter(user => roleCanonical(user.rol?.nombreRol) === "admin");
}

async function unreadFor(userId) {
  return prisma.notificacion.count({
    where: { idUsuario: userId, leida: false },
  });
}

async function notificationsForUser(userId, filters = {}) {
  return prisma.notificacion.findMany({
    where: {
      idUsuario: userId,
      ...(filters.title ? { titulo: filters.title } : {}),
      ...(filters.messageContains ? { mensaje: { contains: filters.messageContains } } : {}),
    },
    orderBy: { idNotificacion: "asc" },
  });
}

async function countEventNotifications(title, messageContains) {
  return prisma.notificacion.findMany({
    where: {
      titulo: title,
      mensaje: { contains: messageContains },
    },
    orderBy: { idNotificacion: "asc" },
  });
}

async function getNotificationsViaApi(session) {
  const response = await request("/notifications", { token: session.token });
  assertCondition(response.status === 200, `GET /notifications fallo: ${response.status}`);
  return response.data;
}

async function getUnreadViaApi(session) {
  const response = await request("/notifications/unread-count", { token: session.token });
  assertCondition(response.status === 200, `GET /notifications/unread-count fallo: ${response.status}`);
  return response.data.unread;
}

async function createService(session, description) {
  const response = await request("/services", {
    token: session.token,
    method: "POST",
    body: { description, priority: "Media", serviceType: "Asistencia Remota" },
  });
  assertCondition(response.status === 201, `POST /services fallo: ${response.status} ${JSON.stringify(response.data)}`);
  created.services.push(response.data.id);
  return response.data;
}

async function testU01(sessions) {
  const admins = await activeAdmins();
  const before = Object.fromEntries(await Promise.all(admins.map(async admin => [admin.idUsuario, await unreadFor(admin.idUsuario)])));
  const service = await createService(sessions.usuario, `${PREFIX}U01 nueva solicitud ${Date.now()}`);
  const messageNeedle = `solicitud #${service.id}`;
  const adminNotifications = await countEventNotifications("Nueva solicitud de servicio", messageNeedle);
  created.notifications.push(...adminNotifications.map(notification => notification.idNotificacion));
  const recipients = [...new Set(adminNotifications.map(notification => notification.idUsuario))].sort((a, b) => a - b);
  const expectedRecipients = admins.map(admin => admin.idUsuario).sort((a, b) => a - b);
  const userAlert = await notificationsForUser(created.users.usuario, { title: "Nueva solicitud de servicio", messageContains: messageNeedle });
  const techAlert = await notificationsForUser(created.users.tecnico, { title: "Nueva solicitud de servicio", messageContains: messageNeedle });
  const after = Object.fromEntries(await Promise.all(admins.map(async admin => [admin.idUsuario, await unreadFor(admin.idUsuario)])));
  const adminAInbox = await getNotificationsViaApi(sessions.adminA);
  const adminBInbox = await getNotificationsViaApi(sessions.adminB);
  const adminASeesOwn = adminAInbox.some(notification => notification.titulo === "Nueva solicitud de servicio" && notification.mensaje.includes(messageNeedle) && notification.usuarioId === created.users.adminA);
  const adminBSeesOwn = adminBInbox.some(notification => notification.titulo === "Nueva solicitud de servicio" && notification.mensaje.includes(messageNeedle) && notification.usuarioId === created.users.adminB);

  const passed = adminNotifications.length === admins.length
    && JSON.stringify(recipients) === JSON.stringify(expectedRecipients)
    && userAlert.length === 0
    && techAlert.length === 0
    && admins.every(admin => after[admin.idUsuario] === before[admin.idUsuario] + 1)
    && adminASeesOwn
    && adminBSeesOwn;

  return addResult("U01", "Nueva solicitud de servicio", {
    emitter: testUsers.usuario.email,
    request: "POST /api/services",
    ids: { serviceId: service.id, notificationIds: adminNotifications.map(item => item.idNotificacion) },
    administradoresEncontrados: admins.length,
    expectedNotifications: admins.length,
    createdNotifications: adminNotifications.length,
    expectedRecipients,
    actualRecipients: recipients,
    counterBefore: before,
    counterAfter: after,
    initialResult: "FAIL confirmado antes de la correccion: no se llamaba helper admin en create service",
    errorFound: passed ? null : "No se crearon copias para todos los administradores o hubo destinatarios incorrectos.",
    correction: "Se agrego notificarAdministradoresSeguro despues de crear la solicitud.",
    finalResult: passed ? "PASS" : "FAIL",
  });
}

async function testU02(sessions) {
  const admins = await activeAdmins();
  const service = await createService(sessions.usuario, `${PREFIX}U02 solicitud a cancelar ${Date.now()}`);
  const before = Object.fromEntries(await Promise.all(admins.map(async admin => [admin.idUsuario, await unreadFor(admin.idUsuario)])));
  const response = await request(`/services/${service.id}/cancel`, { token: sessions.usuario.token, method: "PATCH" });
  const messageNeedle = `solicitud #${service.id}`;
  const adminNotifications = await countEventNotifications("Solicitud cancelada", messageNeedle);
  created.notifications.push(...adminNotifications.map(notification => notification.idNotificacion));
  const after = Object.fromEntries(await Promise.all(admins.map(async admin => [admin.idUsuario, await unreadFor(admin.idUsuario)])));
  const recipients = [...new Set(adminNotifications.map(notification => notification.idUsuario))].sort((a, b) => a - b);
  const expectedRecipients = admins.map(admin => admin.idUsuario).sort((a, b) => a - b);
  const passed = response.status === 200
    && adminNotifications.length === admins.length
    && JSON.stringify(recipients) === JSON.stringify(expectedRecipients)
    && admins.every(admin => after[admin.idUsuario] === before[admin.idUsuario] + 1);

  return addResult("U02", "Cancelacion de solicitud", {
    emitter: testUsers.usuario.email,
    request: `PATCH /api/services/${service.id}/cancel`,
    httpStatus: response.status,
    ids: { serviceId: service.id, notificationIds: adminNotifications.map(item => item.idNotificacion) },
    administradoresEncontrados: admins.length,
    expectedNotifications: admins.length,
    createdNotifications: adminNotifications.length,
    expectedRecipients,
    actualRecipients: recipients,
    counterBefore: before,
    counterAfter: after,
    initialResult: "FAIL antes de esta ronda: cancel no notificaba administradores.",
    errorFound: passed ? null : "Cancelacion no genero todas las alertas admin esperadas.",
    correction: "Se agrego notificarAdministradoresSeguro despues de cancelar.",
    finalResult: passed ? "PASS" : "FAIL",
  });
}

async function assignTechnicianAndPayment(adminSession, serviceId, amount) {
  const response = await request(`/services/${serviceId}`, {
    token: adminSession.token,
    method: "PATCH",
    body: {
      technicianId: created.users.tecnico,
      amount,
      priority: "Media",
      status: "Pendiente",
    },
  });
  assertCondition(response.status === 200, `PATCH /services/:id asignacion fallo: ${response.status} ${JSON.stringify(response.data)}`);
  if (response.data.citaId) created.appointments.push(response.data.citaId);
  if (response.data.paymentId) created.payments.push(response.data.paymentId);
  return response.data;
}

async function testU03(sessions) {
  const admins = await activeAdmins();
  const service = await createService(sessions.usuario, `${PREFIX}U03 pago simulado ${Date.now()}`);
  const assigned = await assignTechnicianAndPayment(sessions.adminA, service.id, 25000);
  const before = Object.fromEntries(await Promise.all(admins.map(async admin => [admin.idUsuario, await unreadFor(admin.idUsuario)])));
  const response = await request(`/payments/${assigned.paymentId}/initiate`, {
    token: sessions.usuario.token,
    method: "POST",
    body: { method: "DaviPlata", reference: `${PREFIX}U03_${Date.now()}` },
  });
  const paymentId = assigned.paymentId;
  const adminNotifications = await countEventNotifications("Pago realizado", `pago #${paymentId}`);
  created.notifications.push(...adminNotifications.map(notification => notification.idNotificacion));
  const after = Object.fromEntries(await Promise.all(admins.map(async admin => [admin.idUsuario, await unreadFor(admin.idUsuario)])));
  const recipients = [...new Set(adminNotifications.map(notification => notification.idUsuario))].sort((a, b) => a - b);
  const expectedRecipients = admins.map(admin => admin.idUsuario).sort((a, b) => a - b);
  const userConfirmation = await notificationsForUser(created.users.usuario, { title: "Pago registrado", messageContains: `pago #${paymentId}` });
  const techConfirmation = await notificationsForUser(created.users.tecnico, { title: "Pago recibido", messageContains: `pago #${paymentId}` });
  const passed = response.status === 200
    && adminNotifications.length === admins.length
    && JSON.stringify(recipients) === JSON.stringify(expectedRecipients)
    && userConfirmation.length >= 1
    && techConfirmation.length >= 1
    && admins.every(admin => after[admin.idUsuario] === before[admin.idUsuario] + 1);

  return addResult("U03", "Pago simulado realizado", {
    emitter: testUsers.usuario.email,
    request: `POST /api/payments/${paymentId}/initiate`,
    httpStatus: response.status,
    ids: { serviceId: service.id, appointmentId: assigned.citaId, paymentId, notificationIds: adminNotifications.map(item => item.idNotificacion) },
    administradoresEncontrados: admins.length,
    expectedNotifications: admins.length,
    createdNotifications: adminNotifications.length,
    expectedRecipients,
    actualRecipients: recipients,
    userConfirmation: userConfirmation.length,
    technicianConfirmation: techConfirmation.length,
    counterBefore: before,
    counterAfter: after,
    initialResult: "FAIL antes de esta ronda: initiate notificaba usuario/tecnico, no administradores.",
    errorFound: passed ? null : "Pago simulado no genero todas las notificaciones esperadas.",
    correction: "Se agrego notificarAdministradoresSeguro despues del pago exitoso.",
    finalResult: passed ? "PASS" : "FAIL",
  });
}

async function createPaidPaymentFlow(sessions, label, userMethod = "DaviPlata") {
  const service = await createService(sessions.usuario, `${PREFIX}${label} ${Date.now()}`);
  const assigned = await assignTechnicianAndPayment(sessions.adminA, service.id, 30000);
  const payment = await request(`/payments/${assigned.paymentId}/initiate`, {
    token: sessions.usuario.token,
    method: "POST",
    body: { method: userMethod, reference: `${PREFIX}${label}_${Date.now()}` },
  });
  assertCondition(payment.status === 200, `initiate fallo en ${label}: ${payment.status}`);
  return { service, assigned, paymentId: assigned.paymentId };
}

async function testT01(sessions) {
  const { service, assigned, paymentId } = await createPaidPaymentFlow(sessions, "T01", "DaviPlata");
  const response = await request(`/payments/${paymentId}/confirm-technician`, {
    token: sessions.tecnico.token,
    method: "POST",
    body: { method: "DaviPlata" },
  });
  const adminReview = await countEventNotifications("Revision de pago requerida", `pago #${paymentId}`);
  const userConfirmation = await notificationsForUser(created.users.usuario, { title: "Pago confirmado", messageContains: `pago #${paymentId}` });
  const passed = response.status === 200
    && response.data?.requiresAdminReview === false
    && adminReview.length === 0
    && userConfirmation.length >= 1;

  return addResult("T01", "Confirmacion correcta de pago por tecnico", {
    emitter: testUsers.tecnico.email,
    request: `POST /api/payments/${paymentId}/confirm-technician`,
    httpStatus: response.status,
    ids: { serviceId: service.id, appointmentId: assigned.citaId, paymentId },
    expectedNotifications: "Usuario recibe confirmacion; no alerta de revision admin.",
    createdNotifications: { userConfirmation: userConfirmation.length, adminReview: adminReview.length },
    correction: "No requerida; comportamiento existente validado.",
    finalResult: passed ? "PASS" : "FAIL",
  });
}

async function testT02T03(sessions) {
  const admins = await activeAdmins();
  const { service, assigned, paymentId } = await createPaidPaymentFlow(sessions, "T02_T03", "DaviPlata");
  const first = await request(`/payments/${paymentId}/confirm-technician`, {
    token: sessions.tecnico.token,
    method: "POST",
    body: { method: "Efectivo" },
  });
  const firstAdminReview = await countEventNotifications("Revision de pago requerida", `pago #${paymentId}`);
  const t02Passed = first.status === 409
    && first.data?.code === "PAYMENT_METHOD_MISMATCH"
    && firstAdminReview.length === 0;

  addResult("T02", "Primer desacuerdo del metodo de pago", {
    emitter: testUsers.tecnico.email,
    request: `POST /api/payments/${paymentId}/confirm-technician`,
    httpStatus: first.status,
    ids: { serviceId: service.id, appointmentId: assigned.citaId, paymentId },
    expectedNotifications: "No alerta definitiva para administradores.",
    createdNotifications: { adminReview: firstAdminReview.length },
    correction: "No requerida; comportamiento existente validado.",
    finalResult: t02Passed ? "PASS" : "FAIL",
  });

  if (!t02Passed) return;

  const before = Object.fromEntries(await Promise.all(admins.map(async admin => [admin.idUsuario, await unreadFor(admin.idUsuario)])));
  const second = await request(`/payments/${paymentId}/confirm-technician`, {
    token: sessions.tecnico.token,
    method: "POST",
    body: { method: "Efectivo" },
  });
  const adminNotifications = await countEventNotifications("Revision de pago requerida", `pago #${paymentId}`);
  created.notifications.push(...adminNotifications.map(notification => notification.idNotificacion));
  const after = Object.fromEntries(await Promise.all(admins.map(async admin => [admin.idUsuario, await unreadFor(admin.idUsuario)])));
  const recipients = [...new Set(adminNotifications.map(notification => notification.idUsuario))].sort((a, b) => a - b);
  const expectedRecipients = admins.map(admin => admin.idUsuario).sort((a, b) => a - b);
  const passed = second.status === 200
    && second.data?.requiresAdminReview === true
    && adminNotifications.length === admins.length
    && JSON.stringify(recipients) === JSON.stringify(expectedRecipients)
    && admins.every(admin => after[admin.idUsuario] === before[admin.idUsuario] + 1);

  addResult("T03", "Segundo desacuerdo del metodo de pago", {
    emitter: testUsers.tecnico.email,
    request: `POST /api/payments/${paymentId}/confirm-technician`,
    httpStatus: second.status,
    ids: { serviceId: service.id, appointmentId: assigned.citaId, paymentId, notificationIds: adminNotifications.map(item => item.idNotificacion) },
    administradoresEncontrados: admins.length,
    expectedNotifications: admins.length,
    createdNotifications: adminNotifications.length,
    expectedRecipients,
    actualRecipients: recipients,
    counterBefore: before,
    counterAfter: after,
    initialResult: "PASS despues de correccion previa del helper de pagos; se revalida mensaje/referencia.",
    errorFound: passed ? null : "No se crearon copias correctas para administradores en revision de pago.",
    correction: "Se ajusto mensaje con pago #id y evento/referencia en helper.",
    finalResult: passed ? "PASS" : "FAIL",
  });
}

async function testS03(sessions) {
  const service = await createService(sessions.usuario, `${PREFIX}S03 tecnico asignado ${Date.now()}`);
  const response = await request(`/services/${service.id}`, {
    token: sessions.adminA.token,
    method: "PATCH",
    body: { technicianId: created.users.tecnico },
  });
  const userNotification = await notificationsForUser(created.users.usuario, { title: "Tecnico asignado", messageContains: `solicitud #${service.id}` });
  const techNotification = await notificationsForUser(created.users.tecnico, { title: "Servicio asignado", messageContains: `solicitud #${service.id}` });
  const adminGlobal = await countEventNotifications("Tecnico asignado", `solicitud #${service.id}`);
  const passed = response.status === 200
    && userNotification.length >= 1
    && techNotification.length >= 1
    && adminGlobal.every(notification => notification.idUsuario === created.users.usuario);
  if (response.data?.citaId) created.appointments.push(response.data.citaId);

  return addResult("S03", "Tecnico asignado por admin", {
    emitter: testUsers.adminA.email,
    request: `PATCH /api/services/${service.id}`,
    httpStatus: response.status,
    ids: { serviceId: service.id, appointmentId: response.data?.citaId },
    expectedNotifications: "Usuario y tecnico reciben notificacion personal; sin alerta global admin.",
    createdNotifications: { userNotification: userNotification.length, techNotification: techNotification.length },
    correction: "No requerida; comportamiento existente validado.",
    finalResult: passed ? "PASS" : "FAIL",
  });
}

async function testS04(sessions) {
  const service = await createService(sessions.usuario, `${PREFIX}S04 cita programada ${Date.now()}`);
  const assigned = await assignTechnicianAndPayment(sessions.adminA, service.id, 35000);
  const response = await request(`/appointments/${assigned.citaId}/schedule`, {
    token: sessions.adminA.token,
    method: "PATCH",
    body: { fecha: "2026-12-20", hora: "10:30", amount: 35000 },
  });
  const userNotification = await notificationsForUser(created.users.usuario, { title: "Cita programada", messageContains: `cita #${assigned.citaId}` });
  const techNotification = await notificationsForUser(created.users.tecnico, { title: "Cita programada", messageContains: `cita #${assigned.citaId}` });
  const passed = response.status === 200 && userNotification.length >= 1 && techNotification.length >= 1;

  return addResult("S04", "Cita programada", {
    emitter: testUsers.adminA.email,
    request: `PATCH /api/appointments/${assigned.citaId}/schedule`,
    httpStatus: response.status,
    ids: { serviceId: service.id, appointmentId: assigned.citaId, paymentId: assigned.paymentId },
    expectedNotifications: "Usuario y tecnico reciben notificacion personal.",
    createdNotifications: { userNotification: userNotification.length, techNotification: techNotification.length },
    correction: "No requerida; comportamiento existente validado.",
    finalResult: passed ? "PASS" : "FAIL",
  });
}

async function testN01ToN06(sessions) {
  const manualTargets = [
    ["adminA", created.users.adminA],
    ["adminB", created.users.adminB],
    ["usuario", created.users.usuario],
    ["tecnico", created.users.tecnico],
  ];
  const manualNotificationIds = [];
  for (const [key, userId] of manualTargets) {
    const response = await request("/notifications", {
      token: sessions.adminA.token,
      method: "POST",
      body: {
        usuarioId: userId,
        tipo: "sistema",
        titulo: `${PREFIX}N01 ${key}`,
        mensaje: `${PREFIX}N01 notificacion personal ${key} ${Date.now()}`,
      },
    });
    assertCondition(response.status === 201, `POST /notifications manual fallo: ${response.status}`);
    manualNotificationIds.push(response.data.id);
    created.notifications.push(response.data.id);
  }

  const inboxes = Object.fromEntries(await Promise.all(Object.entries(sessions).map(async ([key, session]) => [key, await getNotificationsViaApi(session)])));
  const foreignCounts = Object.fromEntries(Object.entries(inboxes).map(([key, notifications]) => [key, notifications.filter(notification => notification.usuarioId !== created.users[key]).length]));
  const n01Passed = Object.values(foreignCounts).every(count => count === 0)
    && Object.entries(inboxes).every(([key, notifications]) => notifications.some(notification => notification.titulo === `${PREFIX}N01 ${key}`));

  addResult("N01", "Bandeja personal", {
    emitter: testUsers.adminA.email,
    request: "GET /api/notifications",
    ids: { notificationIds: manualNotificationIds },
    expectedNotifications: "Cada usuario ve solo su notificacion manual propia.",
    foreignCounts,
    correction: "Regla backend idUsuario=req.user.id validada.",
    finalResult: n01Passed ? "PASS" : "FAIL",
  });

  const unreadApi = Object.fromEntries(await Promise.all(Object.entries(sessions).map(async ([key, session]) => [key, await getUnreadViaApi(session)])));
  const unreadVisible = Object.fromEntries(Object.entries(inboxes).map(([key, notifications]) => [key, notifications.filter(notification => !notification.leida).length]));
  const n02Passed = Object.keys(unreadApi).every(key => unreadApi[key] === unreadVisible[key]);
  addResult("N02", "Contador no leido", {
    request: "GET /api/notifications/unread-count",
    counterApi: unreadApi,
    counterVisible: unreadVisible,
    correction: "Contador backend filtrado por propietario validado.",
    finalResult: n02Passed ? "PASS" : "FAIL",
  });

  const userManual = manualNotificationIds[2];
  const cross = await request(`/notifications/${userManual}/read`, { token: sessions.adminA.token, method: "PATCH" });
  addResult("N03", "Lectura cruzada", {
    emitter: testUsers.adminA.email,
    request: `PATCH /api/notifications/${userManual}/read`,
    httpStatus: cross.status,
    expectedStatus: 403,
    correction: "assertCanAccessNotification exige propietario.",
    finalResult: cross.status === 403 ? "PASS" : "FAIL",
  });

  const beforeAdminB = await unreadFor(created.users.adminB);
  const beforeUser = await unreadFor(created.users.usuario);
  const readAll = await request("/notifications/read-all", { token: sessions.adminB.token, method: "PATCH" });
  const afterAdminB = await unreadFor(created.users.adminB);
  const afterUser = await unreadFor(created.users.usuario);
  addResult("N04", "Marcar todas propias", {
    emitter: testUsers.adminB.email,
    request: "PATCH /api/notifications/read-all",
    httpStatus: readAll.status,
    counterBefore: { adminB: beforeAdminB, usuario: beforeUser },
    counterAfter: { adminB: afterAdminB, usuario: afterUser },
    correction: "updateMany usa idUsuario=req.user.id.",
    finalResult: readAll.status === 200 && afterAdminB === 0 && afterUser === beforeUser ? "PASS" : "FAIL",
  });

  const manualForUser = await request("/notifications", {
    token: sessions.adminA.token,
    method: "POST",
    body: {
      usuarioId: created.users.usuario,
      tipo: "sistema",
      titulo: `${PREFIX}N05 usuario`,
      mensaje: `${PREFIX}N05 creada por admin para usuario ${Date.now()}`,
    },
  });
  created.notifications.push(manualForUser.data?.id);
  const adminAInbox = await getNotificationsViaApi(sessions.adminA);
  const userInbox = await getNotificationsViaApi(sessions.usuario);
  const n05Passed = manualForUser.status === 201
    && userInbox.some(notification => notification.id === manualForUser.data.id)
    && !adminAInbox.some(notification => notification.id === manualForUser.data.id);
  addResult("N05", "Creacion manual por admin para otro usuario", {
    emitter: testUsers.adminA.email,
    request: "POST /api/notifications",
    httpStatus: manualForUser.status,
    ids: { notificationId: manualForUser.data?.id },
    correction: "POST conserva destinatario unico; bandeja del creador no la lista.",
    finalResult: n05Passed ? "PASS" : "FAIL",
  });

  const admins = await activeAdmins();
  const service = await createService(sessions.usuario, `${PREFIX}N06 multiples admins ${Date.now()}`);
  const notifications = await countEventNotifications("Nueva solicitud de servicio", `solicitud #${service.id}`);
  const uniqueRecipients = new Set(notifications.map(notification => notification.idUsuario));
  addResult("N06", "Multiples administradores reciben copias separadas", {
    request: "POST /api/services",
    ids: { serviceId: service.id, notificationIds: notifications.map(notification => notification.idNotificacion) },
    administradoresEncontrados: admins.length,
    notificacionesCreadas: notifications.length,
    destinatariosUnicos: uniqueRecipients.size,
    correction: "Helper crea una fila por administrador activo.",
    finalResult: admins.length === notifications.length && uniqueRecipients.size === admins.length ? "PASS" : "FAIL",
  });
}

async function addNonExecutableResults() {
  addResult("U04", "Comentario o incidencia del usuario", {
    request: "No existe endpoint POST de comentarios/incidencias; comments.service solo lista.",
    correction: "No ejecutable sin implementar endpoint de creacion.",
    finalResult: "NO_EJECUTABLE",
  });
  addResult("U05", "Resena negativa", {
    request: "No existe modulo/ruta API de resenas.",
    correction: "No ejecutable sin endpoint de resenas.",
    finalResult: "NO_EJECUTABLE",
  });
  addResult("T04", "Tecnico reporta indisponibilidad", {
    request: "No existe endpoint de indisponibilidad/reasignacion solicitado por tecnico.",
    correction: "No ejecutable; funcionalidad no implementada.",
    finalResult: "NO_EJECUTABLE",
  });
  addResult("T05", "Incidencia del tecnico", {
    request: "No existe endpoint de incidencia tecnica.",
    correction: "No ejecutable; funcionalidad no implementada.",
    finalResult: "NO_EJECUTABLE",
  });
  addResult("T06", "Servicio finalizado por tecnico", {
    request: "No existe endpoint para que tecnico finalice servicio.",
    correction: "No ejecutable; funcionalidad no implementada.",
    finalResult: "NO_EJECUTABLE",
  });
  addResult("S01", "Servicio sin tecnico", {
    request: "No existe scheduler/cron/regla automatica de seguimiento.",
    correction: "No ejecutable; mecanismo temporal no implementado.",
    finalResult: "NO_EJECUTABLE",
  });
  addResult("S02", "Cita sin programar", {
    request: "No existe scheduler/cron/regla automatica de seguimiento.",
    correction: "No ejecutable; mecanismo temporal no implementado.",
    finalResult: "NO_EJECUTABLE",
  });
}

async function nonRegression(sessions) {
  const checks = [
    ["GET /api/health", () => request("/health")],
    ["POST /api/auth/login", () => request("/auth/login", { method: "POST", body: { email: testUsers.usuario.email, password: PASSWORD } })],
    ["GET /api/auth/me", () => request("/auth/me", { token: sessions.usuario.token })],
    ["GET /api/users/me", () => request("/users/me", { token: sessions.usuario.token })],
    ["GET /api/services", () => request("/services", { token: sessions.usuario.token })],
    ["GET /api/appointments", () => request("/appointments", { token: sessions.usuario.token })],
    ["GET /api/payments", () => request("/payments", { token: sessions.usuario.token })],
    ["GET /api/notifications", () => request("/notifications", { token: sessions.usuario.token })],
  ];
  const details = {};
  for (const [name, fn] of checks) {
    const response = await fn();
    details[name] = response.status;
  }
  const passed = Object.values(details).every(status => status >= 200 && status < 300);
  addResult("NR", "No regresion endpoints principales", {
    request: "health/auth/me/users/services/appointments/payments/notifications",
    httpStatuses: details,
    correction: "Validacion posterior a cambios.",
    finalResult: passed ? "PASS" : "FAIL",
  });
}

async function main() {
  await startServerIfRequested();
  await setupUsers();
  const sessions = await loginUsers();

  await testU01(sessions);
  if (results.at(-1).finalResult !== "PASS") throw new Error("U01 fallo; se detiene la suite por politica.");

  await testU02(sessions);
  await testU03(sessions);
  await testT01(sessions);
  await testT02T03(sessions);
  await testS03(sessions);
  await testS04(sessions);
  await testN01ToN06(sessions);
  await addNonExecutableResults();
  await nonRegression(sessions);

  const failed = results.filter(result => result.finalResult === "FAIL");
  const summary = {
    baseUrl: BASE_URL,
    prefix: PREFIX,
    created,
    results,
    failed: failed.map(result => result.id),
  };
  console.log(`\nNOTIFICATIONS_FLOW_RESULT=${JSON.stringify(summary, null, 2)}`);
  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch(error => {
    console.error("NOTIFICATIONS_FLOW_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServerIfStarted();
    await prisma.$disconnect();
  });
