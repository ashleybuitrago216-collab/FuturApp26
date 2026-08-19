# Plan de normalizacion de base de datos FuturApp

Fecha de elaboracion: 2026-06-02  
Fase: 1 - diagnostico, plan y SQL revisable  
Origen revisado: `futurapp (1).sql`  
Motor del dump: MariaDB 10.4.32 / phpMyAdmin 5.2.1

## A. Resumen del problema

La base original de FuturApp contiene las entidades funcionales que deben predominar sobre el schema Prisma actual. El dump original esta mayormente en espanol, pero conserva abreviaturas y nombres inconsistentes como `usrs`, `tp_servicios`, `id_usrs`, `id_tp_doc`, `id_tp_servicio`, `clave`, `id` en `empleados`, `id_asesora` y `decripcion_problema`.

El schema Prisma actual y varias migraciones ya creadas modelan una base distinta con tablas en ingles: `users`, `services`, `appointments`, `payments`, `notifications`, `comments` y `technician_locations`. Esa estructura no cubre todas las entidades originales del dump y no cumple la regla de nombres en espanol.

Esta fase no aplica cambios a la base. Genera respaldo, plan, SQL manual revisable y un schema Prisma preview normalizado.

## B. Tablas originales detectadas

| Tabla original | Propuesta final | Decision |
|---|---|---|
| areas_especialidad | areas_especialidad | Se conserva |
| asesoria | asesorias | Renombrar a plural |
| ayudas | ayudas | Se conserva |
| citas | citas | Se conserva |
| comentarios | comentarios | Se conserva |
| empleados | empleados | Se conserva |
| equipos | equipos | Se conserva |
| estados | estados | Se conserva |
| estado_pago | estados_pago | Renombrar como catalogo |
| medios_pago | medios_pago | Se conserva |
| notificaciones | notificaciones | Se conserva |
| pagos | pagos | Se conserva |
| prioridades | prioridades | Se conserva |
| reportes | reportes | Se conserva |
| resenas | resenas | Se conserva |
| respuestas_comentarios | respuestas_comentarios | Se conserva |
| roles | roles | Se conserva |
| solicitudes_servicio | solicitudes_servicio | Se conserva; plural correcto como "solicitudes de servicio" |
| tipos_documento | tipos_documento | Se conserva |
| tipos_notificacion | tipos_notificacion | Se conserva |
| tp_servicios | tipos_servicio | Renombrar abreviatura |
| ubicaciones_tecnicos | ubicaciones_tecnicos | Se conserva |
| usrs | usuarios | Renombrar abreviatura |

## C. Columnas originales detectadas

| Tabla | Columnas |
|---|---|
| areas_especialidad | id_area, nombre_area |
| asesoria | id_asesora, id_usrs, id_area, id, id_comentario, id_notificacion, datos_usuario, tipo_asesoria, decripcion_problema, area_especialidad, comentarios, medio_notificacion |
| ayudas | id_ayuda, titulo, categoria, descripcion, archivo_url, fecha_publicacion, estado |
| citas | id_cita, id_solicitud, id_usrs, fecha, hora, confirmada, id_estado |
| comentarios | id_comentario, id_cita, fecha_comentario, id_usrs |
| empleados | id, nombre, fecha_contratacion, salario, telefono, id_area |
| equipos | id_equipo, id_usrs, tipo_equipo, marca_equipo, modelo_equipo, numero_serie, sistema_operativo, fecha_registro, id_estado |
| estados | id_estado, nombre_estado |
| estado_pago | id_estado, nombre_estado, descripcion |
| medios_pago | id_medio, nombre_medio |
| notificaciones | id_notificacion, id_usrs, id_tipo_notif, titulo, mensaje, leida, fecha_envio |
| pagos | id_pago, id_cita, id_medio, id_estado_pago, id_usrs, monto, fecha_pago, detalle_comprobante |
| prioridades | id_prioridad, nombre_prioridad |
| reportes | id_reporte, id_usrs, tipo_reporte, fecha_generacion, fecha_inicio, fecha_fin, formato, descripcion, estado |
| resenas | id_resena, id_usrs, id_asesora, id_solicitud, calificacion, comentario, respuesta_tecnico, fecha_resena, estado |
| respuestas_comentarios | id_respuesta, id_comentario, id_respondedor, texto_respuesta, fecha_respuesta |
| roles | id_rol, nombre_rol |
| solicitudes_servicio | id_solicitud, id_usrs, id_equipo, id_tp_servicio, descripcion_problema, id_prioridad, fecha_solicitud, id_estado |
| tipos_documento | id_tipo_doc, nombre_tipo, tipo_abreviado |
| tipos_notificacion | id_tipo_notif, nombre_tipo |
| tp_servicios | id_tp_servicio, nombre_servicio, desc_servicio, costo |
| ubicaciones_tecnicos | id_ubicacion, id_usrs, latitud, longitud, fecha_registro |
| usrs | id_usrs, id_tp_doc, nombre, apellido, correo, clave, telefono, direccion, id_area, fecha_registro, id_rol, activo |

## D. Llaves primarias

| Tabla original | PK original | PK propuesta |
|---|---|---|
| areas_especialidad | id_area | id_area_especialidad |
| asesoria | id_asesora | id_asesoria |
| ayudas | id_ayuda | id_ayuda |
| citas | id_cita | id_cita |
| comentarios | id_comentario | id_comentario |
| empleados | id | id_empleado |
| equipos | id_equipo | id_equipo |
| estados | id_estado | id_estado |
| estado_pago | id_estado | id_estado_pago |
| medios_pago | id_medio | id_medio_pago |
| notificaciones | id_notificacion | id_notificacion |
| pagos | id_pago | id_pago |
| prioridades | id_prioridad | id_prioridad |
| reportes | id_reporte | id_reporte |
| resenas | id_resena | id_resena |
| respuestas_comentarios | id_respuesta | id_respuesta |
| roles | id_rol | id_rol |
| solicitudes_servicio | id_solicitud | id_solicitud_servicio |
| tipos_documento | id_tipo_doc | id_tipo_documento |
| tipos_notificacion | id_tipo_notif | id_tipo_notificacion |
| tp_servicios | id_tp_servicio | id_tipo_servicio |
| ubicaciones_tecnicos | id_ubicacion | id_ubicacion_tecnico |
| usrs | id_usrs | id_usuario |

## E. Llaves foraneas

| Constraint original | Relacion original | Relacion propuesta |
|---|---|---|
| asesoria_ibfk_1 | asesoria.id_usrs -> usrs.id_usrs | asesorias.id_usuario -> usuarios.id_usuario |
| asesoria_ibfk_2 | asesoria.id_area -> areas_especialidad.id_area | asesorias.id_area_especialidad -> areas_especialidad.id_area_especialidad |
| asesoria_ibfk_3 | asesoria.id -> empleados.id | asesorias.id_empleado -> empleados.id_empleado |
| asesoria_ibfk_4 | asesoria.id_comentario -> comentarios.id_comentario | asesorias.id_comentario -> comentarios.id_comentario |
| asesoria_ibfk_5 | asesoria.id_notificacion -> notificaciones.id_notificacion | asesorias.id_notificacion -> notificaciones.id_notificacion |
| citas_ibfk_1 | citas.id_solicitud -> solicitudes_servicio.id_solicitud | citas.id_solicitud_servicio -> solicitudes_servicio.id_solicitud_servicio |
| citas_ibfk_2 | citas.id_usrs -> usrs.id_usrs | citas.id_usuario -> usuarios.id_usuario |
| citas_ibfk_3 | citas.id_estado -> estados.id_estado | citas.id_estado -> estados.id_estado |
| comentarios_ibfk_1 | comentarios.id_cita -> citas.id_cita | comentarios.id_cita -> citas.id_cita |
| usrs_fk | comentarios.id_usrs -> usrs.id_usrs | comentarios.id_usuario -> usuarios.id_usuario |
| empleados_area | empleados.id_area -> areas_especialidad.id_area | empleados.id_area_especialidad -> areas_especialidad.id_area_especialidad |
| equipos_ibfk_1 | equipos.id_usrs -> usrs.id_usrs | equipos.id_usuario -> usuarios.id_usuario |
| equipos_ibfk_2 | equipos.id_estado -> estados.id_estado | equipos.id_estado -> estados.id_estado |
| notificaciones_ibfk_1 | notificaciones.id_usrs -> usrs.id_usrs | notificaciones.id_usuario -> usuarios.id_usuario |
| notificaciones_ibfk_2 | notificaciones.id_tipo_notif -> tipos_notificacion.id_tipo_notif | notificaciones.id_tipo_notificacion -> tipos_notificacion.id_tipo_notificacion |
| pagos_ibfk_1 | pagos.id_cita -> citas.id_cita | pagos.id_cita -> citas.id_cita |
| pagos_ibfk_2 | pagos.id_medio -> medios_pago.id_medio | pagos.id_medio_pago -> medios_pago.id_medio_pago |
| pagos_ibfk_3 | pagos.id_estado_pago -> estado_pago.id_estado | pagos.id_estado_pago -> estados_pago.id_estado_pago |
| pagos_ibfk_4 | pagos.id_usrs -> usrs.id_usrs | pagos.id_usuario -> usuarios.id_usuario |
| fk_reporte_usuario | reportes.id_usrs -> usrs.id_usrs | reportes.id_usuario -> usuarios.id_usuario |
| fk_resena_asesoria | resenas.id_asesora -> asesoria.id_asesora | resenas.id_asesoria -> asesorias.id_asesoria |
| fk_resena_solicitud | resenas.id_solicitud -> solicitudes_servicio.id_solicitud | resenas.id_solicitud_servicio -> solicitudes_servicio.id_solicitud_servicio |
| fk_resena_usuario | resenas.id_usrs -> usrs.id_usrs | resenas.id_usuario -> usuarios.id_usuario |
| respuestas_comentarios_ibfk_1 | respuestas_comentarios.id_comentario -> comentarios.id_comentario | respuestas_comentarios.id_comentario -> comentarios.id_comentario |
| respuestas_comentarios_ibfk_2 | respuestas_comentarios.id_respondedor -> usrs.id_usrs | respuestas_comentarios.id_usuario_respondedor -> usuarios.id_usuario |
| solicitudes_servicio_ibfk_1 | solicitudes_servicio.id_usrs -> usrs.id_usrs | solicitudes_servicio.id_usuario -> usuarios.id_usuario |
| solicitudes_servicio_ibfk_2 | solicitudes_servicio.id_equipo -> equipos.id_equipo | solicitudes_servicio.id_equipo -> equipos.id_equipo |
| solicitudes_servicio_ibfk_3 | solicitudes_servicio.id_tp_servicio -> tp_servicios.id_tp_servicio | solicitudes_servicio.id_tipo_servicio -> tipos_servicio.id_tipo_servicio |
| solicitudes_servicio_ibfk_4 | solicitudes_servicio.id_prioridad -> prioridades.id_prioridad | solicitudes_servicio.id_prioridad -> prioridades.id_prioridad |
| solicitudes_servicio_ibfk_5 | solicitudes_servicio.id_estado -> estados.id_estado | solicitudes_servicio.id_estado -> estados.id_estado |
| ubicaciones_tecnicos_ibfk_1 | ubicaciones_tecnicos.id_usrs -> usrs.id_usrs | ubicaciones_tecnicos.id_usuario -> usuarios.id_usuario |
| usrs_ibfk_1 | usrs.id_tp_doc -> tipos_documento.id_tipo_doc | usuarios.id_tipo_documento -> tipos_documento.id_tipo_documento |
| usrs_ibfk_2 | usrs.id_area -> areas_especialidad.id_area | usuarios.id_area_especialidad -> areas_especialidad.id_area_especialidad |
| usrs_ibfk_3 | usrs.id_rol -> roles.id_rol | usuarios.id_rol -> roles.id_rol |

## F. Indices

Indices principales detectados:

- Unicos: `areas_especialidad.nombre_area`, `estados.nombre_estado`, `medios_pago.nombre_medio`, `prioridades.nombre_prioridad`, `roles.nombre_rol`, `tipos_documento.nombre_tipo`, `tipos_documento.tipo_abreviado`, `tipos_notificacion.nombre_tipo`, `usrs.correo`, `equipos.numero_serie`.
- Indices de FK: `id_usrs`, `id_area`, `id`, `id_comentario`, `id_notificacion`, `id_solicitud`, `id_estado`, `id_medio`, `id_estado_pago`, `id_prioridad`, `id_tp_servicio`, `id_tipo_notif`, `id_respondedor`.

El SQL manual propone renombrar indices con nombres claros (`idx_*` y `uq_*`) despues de renombrar columnas. Si la version de MariaDB no soporta `RENAME INDEX`, reemplazar por `DROP INDEX` y `ADD INDEX` equivalente.

## G. Datos insertados importantes

El dump contiene datos semilla que no deben perderse:

- Areas: Hardware, Redes, Software, Soporte General.
- Estados: Activo, Pendiente, En Progreso, Finalizado, Cancelado.
- Estados de pago: Pendiente de Pago, Pagado, Fallido, Reembolsado, En Revision.
- Medios de pago: Tarjeta de Credito, Transferencia Bancaria, Pago en Efectivo, PayPal, Criptomonedas.
- Prioridades: Baja, Media, Alta, Urgente, Critica.
- Roles: Administrador, Tecnico, Cliente, Soporte, Visitante.
- Tipos de documento: CC, TI, CE, PAS, DNI.
- Tipos de notificacion: Solicitud Creada, Cita Confirmada, Pago Recibido, Recordatorio de Cita, Comentario Nuevo.
- Tipos de servicio: Mantenimiento Preventivo PC, Instalacion de SO, Revision de Red Domestica, Reparacion de Pantalla Movil, Asistencia Remota.
- Usuarios demo con correos reales de prueba y campo `clave` en texto plano aparente.
- Citas, pagos, comentarios, respuestas, equipos, notificaciones, ubicaciones y solicitudes de servicio ya relacionadas.

## H. Tablas con nombres incorrectos

| Tipo | Nombre actual | Nombre nuevo | Motivo | Impacto |
|---|---|---|---|---|
| Tabla | usrs | usuarios | Abreviatura incorrecta | Impacta Auth, Users, Servicios, Citas, Pagos, Notificaciones, Comentarios, Ubicaciones, Reportes |
| Tabla | tp_servicios | tipos_servicio | Abreviatura incorrecta | Impacta Servicios y solicitudes de servicio |
| Tabla | estado_pago | estados_pago | Catalogo en singular | Impacta Pagos |
| Tabla | asesoria | asesorias | Tabla almacena multiples registros | Impacta Asesorias y Resenas |

## I. Columnas con nombres incorrectos

| Tipo | Nombre actual | Nombre nuevo | Motivo | Impacto |
|---|---|---|---|---|
| Columna | id_usrs | id_usuario | Abreviatura incorrecta | Impacta todas las relaciones con usuarios |
| Columna | clave | contrasena_hash | Debe representar password hasheada | Impacta Auth y seed |
| Columna | id_tp_doc | id_tipo_documento | Abreviatura incorrecta | Impacta usuarios y tipos_documento |
| Columna | id_tp_servicio | id_tipo_servicio | Abreviatura incorrecta | Impacta solicitudes de servicio |
| Columna | desc_servicio | descripcion_servicio | Abreviatura incorrecta | Impacta tipos_servicio |
| Columna | id_asesora | id_asesoria | Error semantico/typo | Impacta asesorias y resenas |
| Columna | decripcion_problema | descripcion_problema | Error ortografico | Impacta asesorias |
| Columna | id | id_empleado | Nombre generico | Impacta empleados y asesorias |
| Columna | id_area | id_area_especialidad | Mas especifico y consistente | Impacta areas, usuarios, empleados, asesorias |
| Columna | nombre_area | nombre_area_especialidad | Mas especifico | Impacta areas |
| Columna | id_estado en estado_pago | id_estado_pago | Evita colision semantica con estados | Impacta pagos |
| Columna | nombre_estado en estado_pago | nombre_estado_pago | Evita ambiguedad | Impacta pagos |
| Columna | id_medio | id_medio_pago | Mas especifico | Impacta pagos |
| Columna | nombre_medio | nombre_medio_pago | Mas especifico | Impacta medios_pago |
| Columna | id_tipo_notif | id_tipo_notificacion | Abreviatura incorrecta | Impacta notificaciones |
| Columna | id_solicitud | id_solicitud_servicio | Mas especifico | Impacta citas y resenas |
| Columna | id_respondedor | id_usuario_respondedor | Mas claro y FK explicita | Impacta respuestas_comentarios |
| Columna | id_ubicacion | id_ubicacion_tecnico | Mas especifico | Impacta ubicaciones_tecnicos |
| Columna | nombre_tipo en tipos_documento | nombre_tipo_documento | Evita ambiguedad | Impacta tipos_documento |
| Columna | nombre_tipo en tipos_notificacion | nombre_tipo_notificacion | Evita ambiguedad | Impacta tipos_notificacion |
| Columna | tipo_abreviado | abreviatura_tipo_documento | Nombre mas claro | Impacta tipos_documento |

## J. Tablas o columnas en ingles

En el dump original no se detectaron tablas completas en ingles como `users`, `services`, `appointments`, `payments`, `notifications`, `comments` o `technician_location`. Esos nombres si aparecen en el schema Prisma actual, migraciones actuales y servicios backend.

Nombres en ingles detectados en el backend/schema actual:

- Modelos Prisma: `User`, `Role`, `Service`, `Appointment`, `Payment`, `Notification`, `Comment`, `TechnicianLocation`.
- Tablas Prisma actuales: `users`, `services`, `appointments`, `payments`, `notifications`, `comments`, `technician_locations`.
- Campos actuales: `passwordHash`, `userId`, `technicianId`, `serviceId`, `appointmentId`, `transactionId`, `amount`, `method`, `status`, `read`, `message`, `type`, `createdAt`, `updatedAt`, `confirmedByTechnician`, `technicianEarnings`, `platformCommission`.

## K. Abreviaturas detectadas

- `usrs`: usuarios.
- `id_usrs`: id_usuario.
- `tp_servicios`: tipos_servicio.
- `id_tp_servicio`: id_tipo_servicio.
- `desc_servicio`: descripcion_servicio.
- `id_tp_doc`: id_tipo_documento.
- `id_tipo_notif`: id_tipo_notificacion.
- `id_asesora`: probable error por id_asesoria.
- `decripcion_problema`: error ortografico por descripcion_problema.

## L. Propuesta final de nombres en espanol

| Tipo | Nombre actual | Nombre nuevo | Motivo | Impacto |
|---|---|---|---|---|
| Tabla | usrs | usuarios | Abreviatura incorrecta | Auth, Users, Servicios, Citas, Pagos, Notificaciones, Comentarios, Ubicaciones |
| Tabla | tp_servicios | tipos_servicio | Abreviatura incorrecta | Services/SolicitudServicio |
| Tabla | estado_pago | estados_pago | Catalogo con multiples estados | Payments/Pago |
| Tabla | asesoria | asesorias | Coleccion de asesorias | Asesorias/Resenas |
| Columna | id_usrs | id_usuario | FK clara hacia usuarios | Todas las relaciones con usuarios |
| Columna | clave | contrasena_hash | No debe guardar texto plano futuro | Auth |
| Columna | id_tp_doc | id_tipo_documento | Abreviatura incorrecta | Usuarios |
| Columna | id_tp_servicio | id_tipo_servicio | Abreviatura incorrecta | SolicitudesServicio |
| Columna | desc_servicio | descripcion_servicio | Abreviatura incorrecta | TiposServicio |
| Columna | id | id_empleado | Nombre generico | Empleados/Asesorias |
| Columna | id_asesora | id_asesoria | Error de nombre | Asesorias/Resenas |
| Columna | decripcion_problema | descripcion_problema | Error ortografico | Asesorias |
| Columna | id_area | id_area_especialidad | Nombre especifico | Areas/Usuarios/Empleados |
| Columna | id_estado en estado_pago | id_estado_pago | Evita ambiguedad | Pagos |
| Columna | id_medio | id_medio_pago | Nombre especifico | Pagos |
| Columna | id_solicitud | id_solicitud_servicio | Nombre especifico | Citas/Resenas |

## M. Impacto por modulo backend

Auth:

- Cambiar `prisma.user` a `prisma.usuario`.
- Usar `usuarios.correo`.
- Usar `usuarios.contrasena_hash`.
- Cargar rol desde `roles`.
- Mapear roles reales al sistema: `Administrador -> admin`, `Tecnico`/`Técnico -> tecnico`, `Cliente -> usuario`, `Usuario -> usuario`.
- `Soporte` y `Visitante` quedan pendientes de decision de producto.
- Nunca devolver `contrasena_hash`.

Users:

- Cambiar `prisma.user` a `prisma.usuario`.
- Operar sobre `Usuario`.
- No devolver `contrasena_hash`.
- Ajustar `id`, `roleId`, `passwordHash`, `createdAt`, `updatedAt` a los campos normalizados.

Services:

- Cambiar `prisma.service` a `prisma.solicitudServicio`.
- Usar `SolicitudServicio`, `TipoServicio`, `Prioridad` y `Estado`.
- Revisar logica actual de tecnico asignado: el dump original no tiene `technicianId` directo en solicitudes; puede estar representado indirectamente por usuario/asesoria/cita o requerir decision funcional.

Appointments:

- Cambiar `prisma.appointment` a `prisma.cita`.
- Usar `Cita` con `id_solicitud_servicio`, `id_usuario`, `fecha`, `hora`, `confirmada`, `id_estado`.
- Revisar estados actuales enum vs catalogo `estados`.

Payments:

- Cambiar `prisma.payment` a `prisma.pago`.
- Usar `Pago`, `MedioPago` y `EstadoPago`.
- Ajustar campos actuales en ingles (`amount`, `method`, `status`, `reference`) a `monto`, `medioPago`, `estadoPago`, `detalleComprobante`.

Notifications:

- Cambiar `prisma.notification` a `prisma.notificacion`.
- Usar `Notificacion` y `TipoNotificacion`.
- Ajustar `message/type/read` a `mensaje/idTipoNotificacion/leida`.

Comments:

- Cambiar `prisma.comment` a `prisma.comentario`.
- Usar `Comentario` y `RespuestaComentario`.
- El dump original de `comentarios` no contiene texto del comentario; el texto existe en `respuestas_comentarios.texto_respuesta`. Esto requiere decision funcional para comentarios de usuarios.

Locations:

- Cambiar `prisma.technicianLocation` a `prisma.ubicacionTecnico`.
- Usar `UbicacionTecnico`.
- Ajustar `technicianId`, `latitude`, `longitude`, `recordedAt` a `idUsuario`, `latitud`, `longitud`, `fechaRegistro`.

Seed:

- Reescribir `server/prisma/seed.js` para usar catalogos originales.
- Evitar `deleteMany` destructivos.
- Reemplazar contrasenas demo en texto plano por bcrypt en `contrasena_hash`.

## N. Riesgos

- El dump contiene `clave` con valores tipo `claveAna`, `claveLuis`; parecen contrasenas en texto plano. Deben tratarse como comprometidas.
- `empleados.fecha_contratacion` contiene `0000-00-00`, valor problematico para Prisma si el SQL mode no permite fechas cero.
- El backend actual no corresponde al dump original; migrar Prisma/backend requerira cambios amplios.
- El dump original no contiene algunos campos que el backend actual usa: comisiones, ganancias del tecnico, transacciones, cita unica por servicio, timestamps `createdAt/updatedAt`, `technicianId` directo en servicios.
- `comentarios` no tiene campo de texto de comentario; puede requerir ajuste funcional en fase 2.
- `asesoria` mezcla FKs y campos duplicados/desnormalizados como `datos_usuario`, `area_especialidad`, `comentario`, `medio_notificacion`.
- Ejecutar `RENAME INDEX` puede variar segun version exacta de MySQL/MariaDB; hay fallback documentado en el SQL.
- Los nombres de constraint se recrean; si la base real ya difiere del dump, los `DROP FOREIGN KEY` pueden fallar.
- No se ejecuto `db pull`, por lo que el plan se basa en el dump y archivos locales, no en introspeccion de una base viva.

## O. Orden recomendado de aplicacion

1. Confirmar con el equipo que la base de datos productiva coincide con `futurapp (1).sql`.
2. Crear backup completo de MySQL/MariaDB.
3. Restaurar el dump en una base clonada, por ejemplo `futurapp_normalizacion_prueba`.
4. Ejecutar `database/migrations/manual/001_normalizacion_nombres_espanol.sql` en la base clonada.
5. Validar conteo de tablas, conteo de filas, constraints e indices.
6. Ejecutar `npx.cmd prisma validate --schema prisma/schema.normalized.preview.prisma`.
7. Ejecutar `npx.cmd prisma db pull --print` contra la base clonada y comparar contra `schema.normalized.preview.prisma`.
8. Ajustar el preview si la introspeccion revela diferencias.
9. En fase 2, adaptar backend por modulos.
10. Solo despues de pruebas, planificar aplicacion a la base real.

## Archivos generados en esta fase

- `server/prisma/schema.backup.prisma`
- `database/backups/futurapp_original_backup.sql`
- `database/migrations/manual/001_normalizacion_nombres_espanol.sql`
- `server/prisma/schema.normalized.preview.prisma`
- `docs/DATABASE_NORMALIZATION_PLAN.md`

## Comandos de validacion ejecutados

- `npx.cmd prisma validate --schema prisma\schema.normalized.preview.prisma`

Resultado: schema Prisma preview valido. Prisma mostro advertencia sobre `package.json#prisma` deprecado para Prisma 7.

## Comandos no ejecutados

- `npx prisma migrate dev`
- `npx prisma migrate reset`
- `npx prisma db push`
- `DROP DATABASE`
- `DROP TABLE`
- `TRUNCATE TABLE`
- `DELETE FROM` sin `WHERE`
- Ejecucion del SQL manual generado

## Recomendacion exacta para fase 2

La fase 2 debe adaptar el backend al schema normalizado, empezando por Auth y Users porque todos los demas modulos dependen de `Usuario` y `Rol`. Despues conviene migrar Services/SolicitudServicio, Appointments/Cita, Payments/Pago, Notifications/Notificacion, Comments/Comentario y Locations/UbicacionTecnico. El seed debe reescribirse al final o en paralelo con Auth, sin operaciones destructivas y con bcrypt para `contrasena_hash`.
