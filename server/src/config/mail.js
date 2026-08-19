import nodemailer from "nodemailer";
import { env } from "./env.js";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function assertMailConfig() {
  if (!env.mail.enabled) return;
  if (!env.mail.host || !env.mail.port || !env.mail.fromAddress) {
    throw new Error("SMTP configuration is incomplete.");
  }
  if ((env.mail.user && !env.mail.pass) || (!env.mail.user && env.mail.pass)) {
    throw new Error("SMTP authentication configuration is incomplete.");
  }
}

export function isMailEnabled() {
  return env.mail.enabled;
}

export function getMailConfigStatus() {
  return {
    enabled: env.mail.enabled,
    hasHost: Boolean(env.mail.host),
    port: env.mail.port,
    secure: env.mail.secure,
    hasUser: Boolean(env.mail.user),
    hasPassword: Boolean(env.mail.pass),
    fromAddress: env.mail.fromAddress,
  };
}

function createTransporter() {
  assertMailConfig();

  return nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    ...(env.mail.user
      ? {
          auth: {
            user: env.mail.user,
            pass: env.mail.pass,
          },
        }
      : {}),
  });
}

export async function sendPasswordResetEmail({ to, resetLink, userName }) {
  if (!env.mail.enabled) {
    return { sent: false, reason: "mail_disabled" };
  }

  const safeName = escapeHtml(userName || "usuario");
  const safeResetLink = escapeHtml(resetLink);
  const fromName = env.mail.fromName || "FuturApp";
  const fromAddress = env.mail.fromAddress;
  const transporter = createTransporter();
  const subject = "Recuperacion de contrasena - FuturApp";

  const text = [
    `Hola ${userName || "usuario"},`,
    "",
    "Recibimos una solicitud para restablecer la contrasena de tu cuenta en FuturApp.",
    `Abre este enlace para crear una nueva contrasena: ${resetLink}`,
    "",
    "El enlace expira en 30 minutos y solo puede usarse una vez.",
    "Si no solicitaste este cambio, puedes ignorar este correo.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h1 style="font-size: 22px; margin-bottom: 12px;">FuturApp</h1>
      <p>Hola ${safeName},</p>
      <p>Recibimos una solicitud para restablecer la contrasena de tu cuenta.</p>
      <p>
        <a href="${safeResetLink}" style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
          Restablecer contrasena
        </a>
      </p>
      <p>Este enlace expira en 30 minutos y solo puede usarse una vez.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${safeResetLink}</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    text,
    html,
  });

  return { sent: true };
}
