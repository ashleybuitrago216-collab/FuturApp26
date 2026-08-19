# Solicitud de Asesoria desde Rol Usuario

Fecha: 2026-06-16

## Alcance

Esta fase permite que un usuario autenticado solicite una asesoria, consulte sus solicitudes y vea su detalle. La solicitud queda pendiente, sin asesor asignado, lista para una fase posterior de asignacion administrativa.

## Base De Datos

Backup previo:

- `database/backups/futurapp_before_advisory_user_phase_20260616_063143.sql`

SQL manual:

- `database/migrations/manual/008_solicitud_asesoria_usuario.sql`

Dump posterior:

- `database/backups/futurapp_after_advisory_user_phase_20260616_064657.sql`

Campos agregados a `asesorias`:

- `tipo_dispositivo`
- `telefono_principal`
- `telefono_alterno`
- `id_tipo_servicio`
- `descripcion_servicio_final`
- `fecha_actualizacion`

Tambien se amplio `descripcion` a `VARCHAR(2000)` porque ahora representa `descripcionInicial`.

## Endpoints

- `POST /api/advisories`: solo rol `usuario`; crea una solicitud pendiente.
- `GET /api/advisories`: role-aware.
  - `usuario`: lista `id_usuario_solicitante = req.user.id`.
  - `asesor`: lista `id_usuario_asesor = req.user.id`.
- `GET /api/advisories/:id`: usuario solicitante o asesor asignado; recurso ajeno devuelve 403.
- `GET /api/advisories/:id/comments`: conserva estado vacio documentado.

## Validaciones

Payload permitido:

- `descripcionInicial`
- `tipoDispositivo`
- `fechaContacto`
- `horaContacto`
- `telefonoPrincipal`
- `telefonoAlterno`

Campos administrativos prohibidos:

- `estado`
- `asesorId`
- `idUsuarioAsesor`
- `tipoServicioId`
- `descripcionServicioFinal`
- `usuarioId`
- `idUsuarioSolicitante`

Reglas:

- Solicitante desde JWT.
- `id_usuario_asesor = NULL`.
- `estado = Pendiente`.
- `id_tipo_servicio = NULL`.
- `descripcion_servicio_final = NULL`.
- Dispositivo limitado a `Computador`, `Celular`, `Tablet`, `Impresora`, `Consola`, `Otro`.
- Fecha/hora no pueden estar en el pasado.
- Telefonos se normalizan a digitos.

## Notificaciones

Al crear solicitud:

- Usuario: `Solicitud de asesoria creada`.
- Administradores activos: `Nueva solicitud de asesoria`, una copia por administrador.
- No se notifica a asesores porque todavia no hay asesor asignado.

## Frontend

Tab nuevo para rol `usuario`:

- `Asesoria`

Pagina:

- `src/pages/UsuarioAsesoriaPage.jsx`

La vista incluye:

- formulario de solicitud;
- listado de solicitudes propias;
- detalle de solicitud propia;
- estados de carga, error, vacio y listado disponible;
- validaciones por campo.

## Pruebas

Script:

- `node server/scripts/test-advisory-user-flow.js --start-server`

Resultado:

- AU01-AU16: PASS

IDs creados en la ejecucion:

- Usuario A: `29`
- Usuario B: `30`
- Tecnico: `31`
- Admin: `28`
- Asesor: `21`
- Asesorias: `3`, `4`, `5`
- Notificaciones: `259`, `260`, `261`, `262`, `263`, `264`, `265`

## Validaciones Tecnicas

- `npx prisma validate`: PASS
- `npx prisma generate`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS
- API temporal: PASS durante pruebas AU
- Frontend dev: HTTP 200 en `http://127.0.0.1:5174`

## Limitaciones

- Usuario no edita, elimina ni resuelve solicitudes.
- Usuario no asigna asesor.
- No se implementa tipo de servicio final ni descripcion final.
- Comentarios de asesoria siguen sin relacion funcional.
- No hay chat, pagos, resenas ni videollamada.

## Proxima Fase

Flujo recomendado:

1. Admin asigna asesor.
2. Asesor contacta al usuario.
3. Asesor define tipo de servicio.
4. Asesor escribe descripcion final.
5. Asesor marca la asesoria como resuelta.

## Reversion

Restaurar en entorno controlado desde:

- `database/backups/futurapp_before_advisory_user_phase_20260616_063143.sql`

Revertir codigo de:

- `server/src/modules/advisories/*`
- `server/prisma/schema.prisma`
- `src/domains/advisories/*`
- `src/pages/UsuarioAsesoriaPage.jsx`
- `src/app/router/appRoutes.jsx`
