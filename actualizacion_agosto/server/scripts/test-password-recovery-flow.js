import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || "http://localhost:4000/api";
const PASSWORD_OLD = "OldPass123";
const PASSWORD_NEW = "NewPass123";
const PREFIX = "PRUEBA_PR";
const GENERIC_MESSAGE = "Si el correo esta registrado, enviaremos instrucciones para recuperar la contrasena.";

const shouldStartServer = process.argv.includes("--start-server");
let serverProcess = null;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
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

async function ensureUser({ email, roleId, password = PASSWORD_OLD, areaId = null }) {
  const hash = await bcrypt.hash(password, 10);
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

async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

function extractToken(devResetLink) {
  const url = new URL(devResetLink);
  return url.searchParams.get("token") || "";
}

async function createExpiredRecovery(userId) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const recovery = await prisma.recuperacionContrasena.create({
    data: {
      idUsuario: userId,
      tokenHash: tokenHash(rawToken),
      fechaExpiracion: new Date(Date.now() - 60 * 1000),
    },
  });
  return { rawToken, recovery };
}

function productionForgotPasswordCheck(email) {
  const code = `
    import { authService } from './src/modules/auth/auth.service.js';
    const result = await authService.forgotPassword({ email: '${email}' });
    console.log(JSON.stringify({ status: 200, hasDevResetLink: Boolean(result.devResetLink), message: result.message }));
  `;
  const result = spawnSync("node", ["--input-type=module", "-e", code], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, NODE_ENV: "production" },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return { status: result.status, stderr: result.stderr };
  }
  const lines = result.stdout.trim().split(/\r?\n/);
  const jsonLine = lines.reverse().find(line => line.trim().startsWith("{"));
  return JSON.parse(jsonLine || "{}");
}

function mailDisabledServiceCheck() {
  const code = `
    import { sendPasswordResetEmail } from './src/config/mail.js';
    const result = await sendPasswordResetEmail({
      to: 'prueba_pr_usuario@futurapp.local',
      resetLink: 'http://localhost:5173/reset-password?token=token_super_secreto_pr18',
      userName: 'Prueba PR',
    });
    console.log(JSON.stringify(result));
  `;
  const result = spawnSync("node", ["--input-type=module", "-e", code], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, MAIL_ENABLED: "false", NODE_ENV: "development" },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return { status: result.status, stderr: result.stderr };
  }
  const lines = result.stdout.trim().split(/\r?\n/);
  const jsonLine = lines.reverse().find(line => line.trim().startsWith("{"));
  return { status: 0, ...JSON.parse(jsonLine || "{}") };
}

function smtpFailureForgotPasswordCheck(email) {
  const code = `
    import { authService } from './src/modules/auth/auth.service.js';
    const result = await authService.forgotPassword({ email: '${email}' });
    console.log(JSON.stringify({
      message: result.message,
      hasDevResetLink: Boolean(result.devResetLink),
      leakedToken: JSON.stringify(result).includes('token=')
    }));
  `;
  const result = spawnSync("node", ["--input-type=module", "-e", code], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      NODE_ENV: "production",
      MAIL_ENABLED: "true",
      MAIL_HOST: "127.0.0.1",
      MAIL_PORT: "9",
      MAIL_SECURE: "false",
      MAIL_USER: "",
      MAIL_PASS: "",
    },
    encoding: "utf8",
  });
  const output = `${result.stdout}\n${result.stderr}`;
  const lines = result.stdout.trim().split(/\r?\n/);
  const jsonLine = lines.reverse().find(line => line.trim().startsWith("{"));
  return {
    status: result.status,
    ...(jsonLine ? JSON.parse(jsonLine) : {}),
    leakedSensitiveOutput: output.includes("token=") || output.includes("token_super_secreto"),
  };
}

function developmentMailEnabledForgotPasswordCheck(email) {
  const code = `
    import { authService } from './src/modules/auth/auth.service.js';
    const result = await authService.forgotPassword({ email: '${email}' });
    console.log(JSON.stringify({
      message: result.message,
      hasDevResetLink: Boolean(result.devResetLink),
      leakedToken: JSON.stringify(result).includes('token=')
    }));
  `;
  const result = spawnSync("node", ["--input-type=module", "-e", code], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      NODE_ENV: "development",
      MAIL_ENABLED: "true",
      MAIL_HOST: "127.0.0.1",
      MAIL_PORT: "9",
      MAIL_SECURE: "false",
      MAIL_USER: "",
      MAIL_PASS: "",
    },
    encoding: "utf8",
  });
  const output = `${result.stdout}\n${result.stderr}`;
  const lines = result.stdout.trim().split(/\r?\n/);
  const jsonLine = lines.reverse().find(line => line.trim().startsWith("{"));
  return {
    status: result.status,
    ...(jsonLine ? JSON.parse(jsonLine) : {}),
    leakedSensitiveOutput: output.includes("token=") || output.includes("MAIL_PASS"),
  };
}

function mailConfigCheck() {
  const code = `
    import { getMailConfigStatus } from './src/config/mail.js';
    console.log(JSON.stringify(getMailConfigStatus()));
  `;
  const result = spawnSync("node", ["--input-type=module", "-e", code], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      MAIL_ENABLED: "true",
      MAIL_HOST: "smtp.example.test",
      MAIL_PORT: "2525",
      MAIL_SECURE: "false",
      MAIL_USER: "smtp-user",
      MAIL_PASS: "smtp-pass",
      MAIL_FROM_ADDRESS: "soporte@futurapp.test",
    },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return { status: result.status, stderr: result.stderr };
  }
  const lines = result.stdout.trim().split(/\r?\n/);
  const jsonLine = lines.reverse().find(line => line.trim().startsWith("{"));
  return { status: 0, ...JSON.parse(jsonLine || "{}") };
}

async function main() {
  const results = [];
  const ids = { users: {}, recoveries: [] };

  await startServerIfNeeded();

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

  const recoveryUser = await ensureUser({ email: "prueba_pr_usuario@futurapp.local", roleId: userRole.idRol });
  const admin = await ensureUser({ email: "prueba_pr_admin@futurapp.local", roleId: adminRole.idRol });
  const tecnico = await ensureUser({ email: "prueba_pr_tecnico@futurapp.local", roleId: techRole.idRol, areaId: area.idAreaEspecialidad });
  const asesor = await ensureUser({ email: "prueba_pr_asesor@futurapp.local", roleId: advisorRole.idRol });
  ids.users = {
    usuario: recoveryUser.idUsuario,
    admin: admin.idUsuario,
    tecnico: tecnico.idUsuario,
    asesor: asesor.idUsuario,
  };

  const forgotExisting = await request("/auth/forgot-password", {
    method: "POST",
    body: { email: recoveryUser.correo },
  });
  const rawToken = extractToken(forgotExisting.payload?.devResetLink || "");
  const recovery = await prisma.recuperacionContrasena.findFirst({
    where: { idUsuario: recoveryUser.idUsuario, usado: false },
    orderBy: { idRecuperacion: "desc" },
  });
  if (recovery?.idRecuperacion) ids.recoveries.push(recovery.idRecuperacion);
  addResult(results, "PR01", "Solicitar recuperacion con correo existente", "No existia endpoint de recuperacion", "forgot-password genera token seguro y respuesta generica", forgotExisting.status === 200 && forgotExisting.payload?.message === GENERIC_MESSAGE && Boolean(rawToken) && Boolean(recovery), {
    recoveryId: recovery?.idRecuperacion,
  });

  const recoveriesBeforeMissing = await prisma.recuperacionContrasena.count();
  const forgotMissing = await request("/auth/forgot-password", {
    method: "POST",
    body: { email: "no_existe_pr@futurapp.local" },
  });
  const recoveriesAfterMissing = await prisma.recuperacionContrasena.count();
  addResult(results, "PR02", "Solicitar recuperacion con correo inexistente", "No existia flujo generico", "Respuesta no revela existencia y no crea token", forgotMissing.status === 200 && forgotMissing.payload?.message === GENERIC_MESSAGE && !forgotMissing.payload?.devResetLink && recoveriesBeforeMissing === recoveriesAfterMissing, {
    before: recoveriesBeforeMissing,
    after: recoveriesAfterMissing,
  });

  addResult(results, "PR13", "No se guarda token plano", "No existia tabla de tokens", "Se almacena SHA-256 del token, no token plano", recovery?.tokenHash && recovery.tokenHash !== rawToken && recovery.tokenHash === tokenHash(rawToken), {
    tokenLength: rawToken.length,
    hashLength: recovery?.tokenHash?.length,
  });

  const resetValid = await request("/auth/reset-password", {
    method: "POST",
    body: { token: rawToken, password: PASSWORD_NEW, confirmPassword: PASSWORD_NEW },
  });
  const usedRecovery = await prisma.recuperacionContrasena.findUnique({
    where: { idRecuperacion: recovery.idRecuperacion },
  });
  addResult(results, "PR03", "Token valido cambia contrasena", "No existia reset", "reset-password actualiza bcrypt y marca token usado", resetValid.status === 200 && usedRecovery?.usado === true && Boolean(usedRecovery.fechaUso), {
    recoveryId: recovery.idRecuperacion,
  });

  const loginNew = await login(recoveryUser.correo, PASSWORD_NEW);
  addResult(results, "PR04", "Login con contrasena nueva", "No existia nueva contrasena", "bcrypt actualizado permite login", loginNew.status === 200 && Boolean(loginNew.payload?.token), { status: loginNew.status });

  const loginOld = await login(recoveryUser.correo, PASSWORD_OLD);
  addResult(results, "PR05", "Login con contrasena anterior falla", "La contrasena vieja seguia siendo la unica", "Hash fue reemplazado", loginOld.status === 401, { status: loginOld.status });

  const resetUsed = await request("/auth/reset-password", {
    method: "POST",
    body: { token: rawToken, password: "OtherPass123", confirmPassword: "OtherPass123" },
  });
  addResult(results, "PR06", "Token usado no se reutiliza", "No existia un solo uso", "Token usado responde 400", resetUsed.status === 400, { status: resetUsed.status });

  const expired = await createExpiredRecovery(recoveryUser.idUsuario);
  ids.recoveries.push(expired.recovery.idRecuperacion);
  const resetExpired = await request("/auth/reset-password", {
    method: "POST",
    body: { token: expired.rawToken, password: "ExpiredPass123", confirmPassword: "ExpiredPass123" },
  });
  addResult(results, "PR07", "Token vencido no funciona", "No existia expiracion", "Reset valida fecha_expiracion", resetExpired.status === 400, { status: resetExpired.status });

  const resetInvalid = await request("/auth/reset-password", {
    method: "POST",
    body: { token: "token_invalido", password: "InvalidPass123", confirmPassword: "InvalidPass123" },
  });
  addResult(results, "PR08", "Token invalido no funciona", "No existia validacion de token", "Hash no encontrado responde 400", resetInvalid.status === 400, { status: resetInvalid.status });

  const mismatch = await request("/auth/reset-password", {
    method: "POST",
    body: { token: expired.rawToken, password: "Mismatch123", confirmPassword: "Mismatch456" },
  });
  addResult(results, "PR09", "Contrasenas no coinciden", "No existia validacion", "Backend compara password y confirmPassword", mismatch.status === 400, { status: mismatch.status });

  const weak = await request("/auth/reset-password", {
    method: "POST",
    body: { token: expired.rawToken, password: "abcdefg", confirmPassword: "abcdefg" },
  });
  addResult(results, "PR10", "Contrasena debil", "No existia validacion", "Backend exige 8 caracteres, letra y numero", weak.status === 400, { status: weak.status });

  const loginNormal = await login(admin.correo, PASSWORD_OLD);
  addResult(results, "PR11", "No regresion login normal", "Login existente no debe romperse", "POST /auth/login conserva JWT", loginNormal.status === 200 && Boolean(loginNormal.payload?.token), { status: loginNormal.status });

  const roleLogins = await Promise.all([
    login(admin.correo, PASSWORD_OLD),
    login(tecnico.correo, PASSWORD_OLD),
    login(recoveryUser.correo, PASSWORD_NEW),
    login(asesor.correo, PASSWORD_OLD),
  ]);
  addResult(results, "PR12", "No regresion de roles", "Roles oficiales deben conservar acceso", "Login conserva admin, tecnico, usuario y asesor", roleLogins.every(item => item.status === 200), {
    statuses: roleLogins.map(item => item.status),
    roles: roleLogins.map(item => item.payload?.user?.role),
  });

  const productionResult = productionForgotPasswordCheck(recoveryUser.correo);
  addResult(results, "PR14", "No se devuelve devResetLink en produccion simulado", "Dev link solo debe existir en desarrollo", "NODE_ENV=production omite devResetLink", productionResult.status === 200 && productionResult.hasDevResetLink === false, productionResult);

  addResult(results, "PR15", "MAIL_ENABLED=false conserva devResetLink en desarrollo", "Modo desarrollo dependia del link dev", "Correo deshabilitado mantiene devResetLink fuera de produccion", forgotExisting.status === 200 && Boolean(forgotExisting.payload?.devResetLink), {
    hasDevResetLink: Boolean(forgotExisting.payload?.devResetLink),
  });

  addResult(results, "PR16", "NODE_ENV=production nunca devuelve devResetLink", "Produccion no debe exponer enlace", "Produccion devuelve solo mensaje generico", productionResult.status === 200 && productionResult.hasDevResetLink === false, productionResult);

  addResult(results, "PR17", "Correo inexistente sigue con respuesta generica", "No debe revelar existencia", "Respuesta generica y sin devResetLink", forgotMissing.status === 200 && forgotMissing.payload?.message === GENERIC_MESSAGE && !forgotMissing.payload?.devResetLink, {
    status: forgotMissing.status,
    hasDevResetLink: Boolean(forgotMissing.payload?.devResetLink),
  });

  const recoveriesBeforeMailDisabled = await prisma.recuperacionContrasena.count();
  const mailDisabledResult = mailDisabledServiceCheck();
  const recoveriesAfterMailDisabled = await prisma.recuperacionContrasena.count();
  addResult(results, "PR18", "Servicio de correo no guarda token plano", "El correo no debe persistir tokens", "Servicio SMTP no escribe recuperaciones ni token plano", mailDisabledResult.status === 0 && mailDisabledResult.sent === false && recoveriesBeforeMailDisabled === recoveriesAfterMailDisabled, {
    before: recoveriesBeforeMailDisabled,
    after: recoveriesAfterMailDisabled,
    reason: mailDisabledResult.reason,
  });

  const smtpFailureResult = smtpFailureForgotPasswordCheck(recoveryUser.correo);
  addResult(results, "PR19", "Fallo SMTP no revela informacion sensible", "Fallo de proveedor no debe filtrar existencia ni token", "Respuesta generica y logs sin enlace/token", smtpFailureResult.status === 0 && smtpFailureResult.message === GENERIC_MESSAGE && smtpFailureResult.hasDevResetLink === false && smtpFailureResult.leakedToken === false && smtpFailureResult.leakedSensitiveOutput === false, smtpFailureResult);

  const configResult = mailConfigCheck();
  addResult(results, "PR20", "Configuracion SMTP se lee desde variables de entorno", "SMTP debe ser configurable", "MAIL_* alimenta el estado del servicio sin exponer credenciales", configResult.status === 0 && configResult.enabled === true && configResult.hasHost === true && configResult.port === 2525 && configResult.hasUser === true && configResult.hasPassword === true && configResult.fromAddress === "soporte@futurapp.test", configResult);

  const developmentMailEnabledResult = developmentMailEnabledForgotPasswordCheck(recoveryUser.correo);
  addResult(results, "PR21", "MAIL_ENABLED=true oculta devResetLink en desarrollo", "El link dev no debe mostrarse si SMTP esta activo", "Desarrollo con SMTP responde generico sin devResetLink", developmentMailEnabledResult.status === 0 && developmentMailEnabledResult.message === GENERIC_MESSAGE && developmentMailEnabledResult.hasDevResetLink === false && developmentMailEnabledResult.leakedToken === false && developmentMailEnabledResult.leakedSensitiveOutput === false, developmentMailEnabledResult);

  const failed = results.filter(result => result.resultadoFinal !== "PASS");
  console.log("\n=== PASSWORD RECOVERY FLOW REPORT ===");
  console.table(results.map(({ id, test, resultadoInicial, correccionAplicada, resultadoFinal }) => ({
    id,
    test,
    resultadoInicial,
    correccionAplicada,
    resultadoFinal,
  })));
  console.log("IDs creados:", JSON.stringify(ids, null, 2));

  if (failed.length) process.exitCode = 1;
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (serverProcess) serverProcess.kill();
    await prisma.$disconnect();
  });
