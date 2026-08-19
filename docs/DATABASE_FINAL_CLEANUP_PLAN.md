# Plan de limpieza final de base de datos

Fecha de auditoria: 2026-06-04

## Objetivo

Dejar la base funcional de FuturApp con tablas normalizadas en espanol, sin `empleados` ni tablas `legacy_*`.

Decision funcional confirmada:

- Los tecnicos no son empleados.
- Un tecnico es un registro de `usuarios` con rol `tecnico` en `roles`.
- Las ganancias del tecnico se calculan desde `pagos -> citas -> id_usuario_tecnico`.

## Respaldo previo

Backup creado antes de preparar la limpieza:

- `database/backups/futurapp_before_cleanup_final.sql`

El backup fue generado desde la base actual `futurapp` con 32 tablas. Como no habia `mysqldump` disponible en PATH, el respaldo se genero via Prisma/Node usando `SHOW CREATE TABLE` y filas serializadas como literales SQL. Esto preserva valores legacy problematicos como `empleados.fecha_contratacion = '0000-00-00'`.

## Hallazgos de auditoria

### Prisma

`server/prisma/schema.prisma` ya fue preparado para el modelo funcional final:

- `model Empleado` fue retirado del schema funcional.
- La relacion `AreaEspecialidad.empleados` fue retirada.
- La relacion `Asesoria.empleado` fue retirada.
- El campo `Asesoria.idEmpleado` fue retirado del cliente Prisma.

La columna fisica `asesorias.id_empleado` sigue existiendo en MySQL hasta ejecutar manualmente `database/migrations/manual/004_limpieza_tablas_no_funcionales.sql`.

### Referencias en backend

No se encontraron usos funcionales de:

- `prisma.empleado`
- `empleados`
- `legacy_*`

en `server/src`.

El backend actual si usa estos modelos en espanol:

- `prisma.usuario`
- `prisma.solicitudServicio`
- `prisma.cita`
- `prisma.pago`
- `prisma.notificacion`

Validacion pendiente resuelta:

- `server/src/modules/comments/comments.service.js` usa `prisma.comentario`.
- `server/src/modules/locations/locations.service.js` usa `prisma.ubicacionTecnico`.
- Ambos endpoints requieren JWT.

## Dependencias MySQL confirmadas

`empleados` tiene llaves foraneas activas:

- `asesorias.id_empleado -> empleados.id_empleado` mediante `fk_asesorias_empleado`.
- `empleados.id_area_especialidad -> areas_especialidad.id_area_especialidad` mediante `fk_empleados_area_especialidad`.

Conteos relevantes al 2026-06-04:

- `empleados`: 3 filas.
- `asesorias` con `id_empleado IS NOT NULL`: 0 filas.
- usuarios con rol `tecnico`: 2.
- citas con `id_usuario_tecnico`: 6.
- pagos asociados a citas con tecnico: 3.

Las tablas `legacy_*` tienen llaves foraneas activas entre ellas, pero no hacia tablas funcionales en espanol. Por eso deben eliminarse como bloque y en orden seguro, o con `FOREIGN_KEY_CHECKS=0` en una ventana controlada.

## Tablas oficiales que quedan

Funcionales principales:

- `usuarios`
- `roles`
- `tipos_documento`
- `areas_especialidad`
- `solicitudes_servicio`
- `tipos_servicio`
- `citas`
- `pagos`
- `medios_pago`
- `estados_pago`
- `notificaciones`
- `tipos_notificacion`
- `comentarios`
- `respuestas_comentarios`
- `ubicaciones_tecnicos`
- `equipos`
- `prioridades`
- `estados`
- `resenas`
- `reportes`
- `ayudas`
- `asesorias`

Sistema:

- `_prisma_migrations`

## Tablas que se eliminan

- `empleados`
- `legacy_appointments_20260602_215008`
- `legacy_comments_20260602_215008`
- `legacy_notifications_20260602_215008`
- `legacy_payments_20260602_215008`
- `legacy_roles_20260602_215008`
- `legacy_services_20260602_215008`
- `legacy_technician_locations_20260602_215008`
- `legacy_users_20260602_215008`

## Motivo de eliminacion

`empleados` se elimina porque contradice el modelo funcional final: los tecnicos son usuarios con rol `tecnico`, no empleados asalariados.

Las tablas `legacy_*` se eliminan porque son respaldo temporal del esquema anterior en ingles. Ya no deben participar en consultas, relaciones ni modelo Prisma funcional.

## Impacto esperado

Impacto esperado nulo sobre:

- Auth
- Users
- Services
- Appointments
- Payments
- Notifications

Riesgos antes de ejecutar:

- Cualquier proceso externo no auditado que consulte `empleados` o `legacy_*` fallara despues del DROP.

## Validaciones previas obligatorias

Ejecutar antes del SQL destructivo:

```sql
SELECT COUNT(*) AS empleados_total FROM empleados;
SELECT COUNT(*) AS asesorias_con_empleado FROM asesorias WHERE id_empleado IS NOT NULL;

SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE 'legacy\_%'
ORDER BY TABLE_NAME;

SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND (TABLE_NAME = 'empleados'
    OR REFERENCED_TABLE_NAME = 'empleados'
    OR TABLE_NAME LIKE 'legacy\_%'
    OR REFERENCED_TABLE_NAME LIKE 'legacy\_%')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION;
```

Condiciones para ejecutar:

- Existe y se probo `database/backups/futurapp_before_cleanup_final.sql`.
- `asesorias_con_empleado = 0`.
- Backend corregido o validado para usar `prisma.comentario` y `prisma.ubicacionTecnico`.
- `schema.prisma` fue actualizado para retirar `model Empleado` y relaciones/campos asociados.
- No hay referencias a `prisma.empleado`, `empleados` o `legacy_*` en backend funcional.

## SQL manual revisable

Archivo preparado:

- `database/migrations/manual/004_limpieza_tablas_no_funcionales.sql`

Estado:

- Ejecutado sobre la base oficial `futurapp` el 2026-06-04.
- Elimino `empleados` y las tablas `legacy_*`.
- Retiro la FK/indice/columna obsoleta `asesorias.id_empleado`.

SQL final funcional generado:

- `database/backups/futurapp_final_funcional.sql`

## Reversion

Para revertir despues de una ejecucion aprobada:

1. Detener el backend.
2. Restaurar la base desde `database/backups/futurapp_before_cleanup_final.sql`.
3. Restaurar el `schema.prisma` compatible con `empleados` si ya fue modificado.
4. Ejecutar `npx prisma generate` si el cliente Prisma debe alinearse con el schema restaurado.
5. Levantar backend y validar Auth, Users, Services, Appointments, Payments y Notifications.

## Diferencia funcional entre comentarios y resenas

`comentarios`: mensajes, seguimiento o comunicacion durante el servicio o la cita.

`resenas`: calificacion final posterior al servicio, con comentario evaluativo y posible respuesta del tecnico.
