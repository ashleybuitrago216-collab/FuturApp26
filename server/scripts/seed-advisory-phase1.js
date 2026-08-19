import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import { crearNotificacionSistemaSegura } from "../src/modules/notifications/notifications.service.js";

const PASSWORD = "123456";
const PREFIX = "PRUEBA_ASESORIA_FASE1";

async function main() {
  const asesorRole = await prisma.rol.upsert({
    where: { nombreRol: "Asesor" },
    update: {},
    create: { nombreRol: "Asesor" },
  });

  const usuarioRole = await prisma.rol.upsert({
    where: { nombreRol: "Usuario" },
    update: {},
    create: { nombreRol: "Usuario" },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const asesor = await prisma.usuario.upsert({
    where: { correo: "asesor@futurapp.com" },
    update: {
      nombre: "Asesor",
      apellido: "FuturApp",
      contrasenaHash: passwordHash,
      idRol: asesorRole.idRol,
      idAreaEspecialidad: null,
      activo: true,
    },
    create: {
      nombre: "Asesor",
      apellido: "FuturApp",
      correo: "asesor@futurapp.com",
      contrasenaHash: passwordHash,
      idRol: asesorRole.idRol,
      activo: true,
    },
  });

  const solicitante = await prisma.usuario.upsert({
    where: { correo: "solicitante.asesoria@futurapp.local" },
    update: {
      nombre: "Solicitante",
      apellido: "Asesoria",
      contrasenaHash: passwordHash,
      idRol: usuarioRole.idRol,
      idAreaEspecialidad: null,
      activo: true,
    },
    create: {
      nombre: "Solicitante",
      apellido: "Asesoria",
      correo: "solicitante.asesoria@futurapp.local",
      contrasenaHash: passwordHash,
      idRol: usuarioRole.idRol,
      activo: true,
    },
  });

  const existing = await prisma.asesoria.findFirst({
    where: {
      idUsuarioAsesor: asesor.idUsuario,
      motivo: `${PREFIX} Orientacion inicial`,
    },
  });

  const asesoria = existing || await prisma.asesoria.create({
    data: {
      idUsuarioSolicitante: solicitante.idUsuario,
      idUsuarioAsesor: asesor.idUsuario,
      fecha: new Date("2026-07-01T00:00:00.000Z"),
      hora: new Date("1970-01-01T09:30:00.000Z"),
      estado: "Programada",
      motivo: `${PREFIX} Orientacion inicial`,
      descripcion: "El usuario necesita ayuda para identificar el tipo de servicio requerido.",
      fechaCreacion: new Date(),
    },
  });

  const notification = await crearNotificacionSistemaSegura({
    idUsuario: asesor.idUsuario,
    tipo: "sistema",
    titulo: "Asesoria programada",
    mensaje: `Tienes una asesoria programada #${asesoria.idAsesoria}.`,
    evento: "asesoria_programada_seed",
    referenciaTipo: "asesoria",
    referenciaId: asesoria.idAsesoria,
  });

  console.log(JSON.stringify({
    asesorId: asesor.idUsuario,
    solicitanteId: solicitante.idUsuario,
    asesoriaId: asesoria.idAsesoria,
    notificacionId: notification?.id || null,
  }, null, 2));
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
