# Plan de migracion Appointments/Citas - Fase 3B

Fecha: 2026-06-02

## 1. Estado actual de citas

La tabla `citas` en la base actual ya contiene:

- `id_cita`
- `id_solicitud_servicio`
- `id_usuario_cliente`
- `id_usuario_tecnico`
- `fecha`
- `hora`
- `confirmada`
- `id_estado`

Los datos historicos del dump original usaban `id_usuario`; al compararlos con `solicitudes_servicio.id_usuario`, esos valores corresponden al cliente de la solicitud.

## 2. Problema detectado

El backend anterior usaba `Appointment.userId`, `Appointment.technicianId` y `Appointment.serviceId`. El schema Prisma normalizado todavia modelaba `Cita.idUsuario` como una sola relacion, lo que impedia asignar tecnico de forma segura.

## 3. Decision de modelo

El modelo operativo queda con cliente y tecnico explicitos:

- `id_usuario_cliente` -> `usuarios.id_usuario`
- `id_usuario_tecnico` -> `usuarios.id_usuario`
- `id_solicitud_servicio` -> `solicitudes_servicio.id_solicitud_servicio`

`id_solicitud_servicio` tiene indice unico para evitar mas de una cita por solicitud.

## 4. Columnas nuevas o renombradas

Para bases que aun tengan estructura anterior, el SQL manual `003_citas_asignacion_tecnico.sql` agrega:

- `id_usuario_cliente`
- `id_usuario_tecnico`

No elimina datos. En la base actual estas columnas ya existen, por lo que no se aplico el SQL.

## 5. Relaciones nuevas

- `fk_citas_usuario_cliente`
- `fk_citas_usuario_tecnico`
- `fk_citas_solicitud_servicio`
- `fk_citas_estado`

## 6. Impacto en Services

`PATCH /api/services/:id` con `technicianId` o `tecnicoId` ahora:

1. Requiere admin.
2. Valida que el usuario tecnico exista y tenga rol `tecnico`.
3. Crea o actualiza una cita asociada a la solicitud.
4. Usa `id_solicitud_servicio` para no duplicar citas.
5. Devuelve el servicio con `technicianId` derivado de la cita.

## 7. Impacto en Appointments

Appointments deja de usar modelos antiguos en ingles y pasa a:

- `prisma.cita`
- `prisma.solicitudServicio`
- `prisma.usuario`
- `prisma.estado`

La API externa se mantiene en `/api/appointments`.

## 8. Riesgos

- La tabla `estados` no tiene `Programada` ni `Completada`; se mapean a `Pendiente` y `Finalizado` respectivamente.
- Pagos todavia dependen de citas y se migraran despues.
- Datos historicos sin tecnico quedan con `id_usuario_tecnico = NULL`.

## 9. Instrucciones para aplicar SQL

Solo aplicar `database/migrations/manual/003_citas_asignacion_tecnico.sql` en bases que no tengan `id_usuario_cliente` e `id_usuario_tecnico`.

Antes:

1. Hacer backup completo.
2. Verificar duplicados:
   `SELECT id_solicitud_servicio, COUNT(*) FROM citas WHERE id_solicitud_servicio IS NOT NULL GROUP BY id_solicitud_servicio HAVING COUNT(*) > 1;`
3. Confirmar que existen `usuarios`, `solicitudes_servicio` y `estados`.

## 10. Como revertir

Usar el backup:

- `database/backups/futurapp_before_phase3b_20260602_222544.sql`

O, si se aplico solo `003` en otra base, seguir la seccion de reversion comentada al final del SQL.
