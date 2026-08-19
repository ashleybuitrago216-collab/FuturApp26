import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "123456";

const roleSeeds = [
  { key: "admin", nombreRol: "Administrador" },
  { key: "tecnico", nombreRol: "Tecnico" },
  { key: "usuario", nombreRol: "Usuario" },
];

const userSeeds = [
  {
    correo: "admin@futurapp.com",
    nombre: "Admin",
    apellido: "FuturApp",
    telefono: "3000000000",
    roleKey: "admin",
  },
  {
    correo: "tecnico@futurapp.com",
    nombre: "Tecnico",
    apellido: "FuturApp",
    telefono: "3100000000",
    roleKey: "tecnico",
  },
  {
    correo: "usuario@futurapp.com",
    nombre: "Usuario",
    apellido: "FuturApp",
    telefono: "3200000000",
    roleKey: "usuario",
  },
];

async function main() {
  const contrasenaHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const roles = {};

  for (const role of roleSeeds) {
    roles[role.key] = await prisma.rol.upsert({
      where: { nombreRol: role.nombreRol },
      update: {},
      create: { nombreRol: role.nombreRol },
    });
  }

  for (const user of userSeeds) {
    await prisma.usuario.upsert({
      where: { correo: user.correo },
      update: {
        nombre: user.nombre,
        apellido: user.apellido,
        telefono: user.telefono,
        contrasenaHash,
        idRol: roles[user.roleKey].idRol,
        activo: true,
      },
      create: {
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        telefono: user.telefono,
        contrasenaHash,
        idRol: roles[user.roleKey].idRol,
        activo: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
