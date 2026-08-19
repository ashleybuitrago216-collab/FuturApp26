# Modulo Asesoria - Fase 1

Fecha: 2026-06-15

## Alcance

Esta fase agrega el rol oficial `asesor` y un panel inicial para asesores. El asesor puede iniciar sesion, ver su perfil real, consultar sus asesorias asignadas, ver notificaciones personales y consultar el estado de comentarios relacionados con asesorias.

No se implementan todavia solicitud de asesoria por usuario, asignacion avanzada, chat, videollamadas, pagos, resenas, agenda avanzada ni cron.

## Base De Datos

Backup previo:

- `database/backups/futurapp_before_asesor_phase1_20260615_223358.sql`

Migracion manual:

- `database/migrations/manual/007_modulo_asesoria_fase1.sql`

Dump posterior:

- `database/backups/futurapp_after_asesor_phase1_20260615_225243.sql`

Cambios aplicados:

- Inserta rol `Asesor` si no existe.
- Agrega a `asesorias` columnas opcionales:
  - `id_usuario_solicitante`
  - `id_usuario_asesor`
  - `fecha`
  - `hora`
  - `estado`
  - `motivo`
  - `descripcion`
  - `fecha_creacion`
- Agrega indices y FKs hacia `usuarios.id_usuario` para solicitante y asesor.
- Conserva columnas legacy de `asesorias`.

## Prisma

`Asesoria` conserva la relacion legacy `id_usuario` y agrega relaciones separadas:

- `solicitante`
- `asesor`

`Usuario` agrega:

- `asesoriasLegacy`
- `asesoriasSolicitadas`
- `asesoriasAsignadas`

## Backend

Endpoint base:

- `GET /api/advisories`
- `GET /api/advisories/:id`
- `GET /api/advisories/:id/comments`

Reglas:

- Requiere JWT.
- Solo rol `asesor`.
- Listado filtra por `id_usuario_asesor = req.user.id`.
- Detalle devuelve `403` si la asesoria pertenece a otro asesor.
- Comentarios devuelve estado vacio documentado porque `comentarios` aun no tiene FK funcional a `asesorias`.

Auth y users:

- `Asesor -> asesor` en `mapDatabaseRoleToSystemRole`.
- `GET /api/users/catalogs` incluye `Asesor`.
- Admin puede asignar rol `asesor`.
- Asesor no requiere `id_area_especialidad`.

## Frontend

Menu del asesor:

- Inicio
- Mi perfil
- Mis asesorias
- Comentarios
- Notificaciones

El asesor no ve:

- Usuarios
- Servicios
- Citas
- Pagos
- Informes

Páginas nuevas:

- `src/pages/AsesorDashboardPage.jsx`
- `src/pages/AsesoriasPage.jsx`
- `src/pages/AsesorComentariosPage.jsx`

Dominio nuevo:

- `src/domains/advisories/services/advisoriesApi.js`
- `src/domains/advisories/services/advisoryMappers.js`

## Datos Demo

Script:

- `node server/scripts/seed-advisory-phase1.js`

Credenciales:

- `asesor@futurapp.com`
- `123456`

Registros creados:

- Asesor demo: `id_usuario=21`
- Solicitante demo: `id_usuario=22`
- Asesoria demo: `id_asesoria=1`
- Notificacion demo: `id_notificacion=257`

## Pruebas

Script:

- `node server/scripts/test-advisory-phase1.js --start-server`

Resultado:

- A01-A12: PASS

IDs principales de prueba:

- Admin test: `23`
- Asesor demo: `21`
- Asesor B: `24`
- Usuario: `25`
- Tecnico: `26`
- Usuario cambio de rol: `27`
- Asesoria propia: `1`
- Asesoria ajena: `2`

## Validaciones

- `npx prisma validate`: PASS
- `npx prisma generate`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS
- `GET /api/health`: PASS, database connected
- Login asesor: PASS, `role=asesor`

## Limitaciones

- `comentarios` no tiene `id_asesoria`; por ahora el modulo devuelve estado vacio para comentarios de asesorias.
- No existe flujo de creacion de asesorias desde usuario.
- No existe pantalla admin dedicada para asignar asesorias.
- No existe chat, videollamada, pagos de asesoria, resenas ni cron.

## Reversion

Codigo:

- Revertir archivos listados en el cierre de la tarea o restaurar desde control de versiones.

Base de datos:

- Restaurar `database/backups/futurapp_before_asesor_phase1_20260615_223358.sql` sobre una copia de la base o entorno controlado.
- No usar `DROP DATABASE` en produccion. Crear una base temporal, validar el backup y luego planear la restauracion.

SQL manual aplicado:

- `database/migrations/manual/007_modulo_asesoria_fase1.sql`
