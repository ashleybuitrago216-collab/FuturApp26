# Resolucion De Asesoria Y Creacion De Servicio

Fecha: 2026-06-16

## Objetivo

Esta fase permite que un usuario con rol `asesor` resuelva una asesoria asignada y genere automaticamente una solicitud de servicio real para el usuario solicitante.

El servicio generado queda disponible en el modulo normal de Servicios para que el administrador use el flujo existente:

- asignar tecnico;
- definir monto;
- crear o actualizar cita;
- crear pago pendiente.

No se crea tecnico, cita, pago ni monto durante la resolucion de asesoria.

## Diagnostico Inicial

Archivos revisados:

- `server/src/modules/advisories/advisories.service.js`
- `server/src/modules/advisories/advisories.controller.js`
- `server/src/modules/advisories/advisories.routes.js`
- `server/src/modules/advisories/advisories.mapper.js`
- `server/src/modules/services/services.service.js`
- `server/src/modules/services/services.mapper.js`
- `server/src/modules/notifications/notifications.service.js`
- `server/src/modules/users/users.service.js`
- `server/src/modules/auth/auth.service.js`
- `server/prisma/schema.prisma`
- `server/src/routes/index.js`
- `src/pages/AsesoriasPage.jsx`
- `src/pages/AsesorDashboardPage.jsx`
- `src/pages/UsuarioAsesoriaPage.jsx`
- `src/domains/advisories/services/advisoriesApi.js`
- `src/domains/advisories/services/advisoryMappers.js`

Estado previo:

- `asesorias` tenia solicitante, asesor, tipo de servicio final y descripcion final.
- `asesorias` no tenia relacion persistente con `solicitudes_servicio`.
- `solicitudes_servicio.id_equipo` es nullable.
- Existe estado `Pendiente` en `estados`.
- Existe prioridad `Media` en `prioridades`.
- `tipos_servicio` es catalogo real de MySQL.

Decision tecnica:

- Agregar `asesorias.id_solicitud_servicio` como FK nullable y unica.
- Crear una funcion interna reusable en Services: `crearServicioDesdeAsesoria`.
- Resolver la asesoria mediante `PATCH /api/advisories/:id/resolve`.
- Ejecutar creacion de servicio y actualizacion de asesoria dentro de una transaccion Prisma.
- Retornar `409` en segundo intento para no duplicar servicios.

## Base De Datos

Backup previo:

```text
database/backups/futurapp_before_advisory_resolution_20260616_100756.sql
```

SQL creado y aplicado:

```text
database/migrations/manual/009_resolucion_asesoria_creacion_servicio.sql
```

Campo agregado:

```text
asesorias.id_solicitud_servicio INT NULL
```

Indice unico:

```text
uq_asesorias_solicitud_servicio (id_solicitud_servicio)
```

Foreign key:

```text
fk_asesorias_solicitud_servicio
asesorias.id_solicitud_servicio
  -> solicitudes_servicio.id_solicitud_servicio
ON DELETE SET NULL
ON UPDATE CASCADE
```

Prisma actualizado:

- `Asesoria.idSolicitudServicio`
- `Asesoria.solicitudServicio`
- `SolicitudServicio.asesoriaOrigen`

Dump posterior:

```text
database/backups/futurapp_after_advisory_resolution_20260616_101412.sql
```

## Backend

Archivos modificados:

- `server/prisma/schema.prisma`
- `server/src/modules/services/services.service.js`
- `server/src/modules/advisories/advisories.service.js`
- `server/src/modules/advisories/advisories.controller.js`
- `server/src/modules/advisories/advisories.routes.js`
- `server/src/modules/advisories/advisories.mapper.js`

Archivo creado:

- `server/scripts/test-advisory-resolution-flow.js`

Endpoint nuevo:

```text
GET   /api/advisories/catalogs
PATCH /api/advisories/:id/resolve
```

Catalogo:

- Acceso: solo `asesor`.
- Fuente: tabla real `tipos_servicio`.
- No permite crear tipos desde asesorias.

Payload de resolucion:

```json
{
  "tipoServicioId": 1,
  "descripcionServicioFinal": "Descripcion final para crear servicio"
}
```

Validaciones:

- JWT obligatorio.
- Rol `asesor`.
- Asesoria existente.
- Asesoria asignada al asesor autenticado.
- Estado `Pendiente`.
- Sin `id_solicitud_servicio`.
- Tipo de servicio existente.
- Descripcion final obligatoria.
- Solicitante existente y activo.
- Rechazo de campos administrativos en payload.

Transaccion:

```text
prisma.$transaction
  -> validar asesoria
  -> validar tipo
  -> validar solicitante
  -> crear solicitud de servicio
  -> actualizar asesoria como Asesoria resuelta
  -> relacionar id_solicitud_servicio
```

Prevencion de duplicados:

- Validacion por `idSolicitudServicio`.
- Indice unico en base de datos.
- Segundo intento devuelve `409`.

Notificaciones posteriores a la transaccion:

- Usuario solicitante: `Asesoria resuelta`.
- Administradores activos: `Nuevo servicio generado desde asesoria`.
- Asesor: `Asesoria finalizada`.
- Tecnicos: no reciben notificacion en esta fase.

## Frontend Asesor

Archivo principal:

```text
src/pages/AsesoriasPage.jsx
```

Cambios:

- Muestra `Responder asesoria` solo si:
  - estado es `Pendiente`;
  - no existe `serviceId`.
- Carga catalogo real con `GET /api/advisories/catalogs`.
- Abre modal con datos de solo lectura:
  - usuario;
  - dispositivo;
  - fecha y hora;
  - telefonos;
  - descripcion inicial.
- Permite seleccionar tipo de servicio.
- Permite escribir descripcion final.
- Confirma antes de terminar.
- Deshabilita flujo durante envio.
- Refresca la lista tras resolver.
- Muestra servicio generado cuando existe.

## Frontend Usuario

Archivo principal:

```text
src/pages/UsuarioAsesoriaPage.jsx
```

Cambios:

- Cuando la asesoria esta resuelta muestra:
  - estado;
  - tipo de servicio final;
  - descripcion final;
  - solicitud de servicio generada.
- El usuario no puede editar tipo final, descripcion final ni servicio generado.
- El servicio aparece tambien en el modulo normal de Servicios porque se crea en `solicitudes_servicio`.

## Integracion Administrativa

El servicio generado aparece en:

```text
GET /api/services
```

Para el administrador queda como:

- estado: `Pendiente`;
- tecnico: `NULL`;
- cita: no creada;
- pago: no creado;
- monto: no definido;
- prioridad: `Media`;
- equipo: `NULL`.

## Pruebas

Script:

```text
server/scripts/test-advisory-resolution-flow.js
```

Comando:

```bash
node server/scripts/test-advisory-resolution-flow.js --start-server
```

Resultado: todas las pruebas AR01-AR18 terminaron en `PASS`.

| ID | Prueba | Resultado inicial | Correccion aplicada | Resultado final |
| -- | ------ | ----------------- | ------------------- | --------------- |
| AR01 | Boton visible para asesoria pendiente | No existia accion de respuesta | UI muestra accion si esta Pendiente y sin serviceId | PASS |
| AR02 | Boton no visible para asesoria resuelta | No existia estado resuelto con servicio | UI oculta accion con serviceId o estado resuelto | PASS |
| AR03 | Catalogo real | No habia catalogo para asesor | `GET /api/advisories/catalogs` lee MySQL | PASS |
| AR04 | Resolucion valida | No existia endpoint | `PATCH /api/advisories/:id/resolve` transaccional | PASS |
| AR05 | Servicio generado | No habia relacion asesoria-servicio | Servicio Pendiente, sin tecnico/cita/pago | PASS |
| AR06 | Usuario ve resultado | UI no mostraba resultado final | Mapper y UI exponen tipo, descripcion y serviceId | PASS |
| AR07 | Admin ve servicio | Servicio no se generaba | Servicio aparece en `/api/services` | PASS |
| AR08 | Asesor ajeno | No existia validacion | Valida asesor asignado | PASS |
| AR09 | Rol incorrecto | No existia endpoint | Solo rol asesor resuelve | PASS |
| AR10 | Tipo invalido | Catalogo no validado | Backend valida tipo real | PASS |
| AR11 | Descripcion vacia | Sin validacion | Descripcion final obligatoria | PASS |
| AR12 | Segundo intento | Podia duplicarse sin FK | FK unica + validacion 409 | PASS |
| AR13 | Fallo transaccional | Riesgo de parcial | Usuario inactivo no crea servicio ni cambia asesoria | PASS |
| AR14 | Notificacion usuario | No existia evento | Notificacion personal posterior a transaccion | PASS |
| AR15 | Notificacion administradores | No existia evento | Copia para cada admin activo | PASS |
| AR16 | Sin notificacion a tecnicos | Riesgo de alerta prematura | No se notifica tecnico antes de asignacion | PASS |
| AR17 | No regresion Services | Riesgo por reutilizar service helper | Listados usuario/admin/tecnico responden | PASS |
| AR18 | No regresion general | Riesgo por schema/endpoints | Health, auth, users, citas, pagos, notificaciones y asesorias responden | PASS |

## Datos De Prueba

Usuarios creados o reutilizados por el script:

- Admin: `32`
- Usuario: `33`
- Tecnico: `34`
- Asesor asignado: `35`
- Asesor ajeno: `36`
- Usuario inactivo: `37`

Asesorias:

- `7`: resuelta exitosamente.
- `8`: seed resuelta para validar boton oculto.
- `9`: asesor ajeno.
- `10`: roles incorrectos/tipo/descripcion.
- `11`: fallo transaccional por usuario inactivo.

Servicios:

- `35`: seed para asesoria resuelta.
- `36`: generado desde asesoria `7`.

Notificaciones administrativas de la prueba:

- `288`
- `289`
- `290`
- `291`
- `292`
- `293`
- `294`

Administradores activos detectados:

```text
10, 14, 17, 18, 23, 28, 32
```

## Validaciones Tecnicas

Backend:

- `node --check server/src/modules/advisories/advisories.service.js`: PASS.
- `node --check server/src/modules/services/services.service.js`: PASS.
- `node --check server/src/modules/advisories/advisories.controller.js`: PASS.
- `node --check server/scripts/test-advisory-resolution-flow.js`: PASS.
- `npx prisma validate`: PASS.
- `npx prisma generate`: PASS despues de detener procesos Node del proyecto que bloqueaban Prisma Client.
- Backend: probado por el script con servidor temporal en `http://localhost:4000`.
- `GET /api/health`: PASS dentro de AR18.

Frontend:

- `npm run lint`: PASS.
- `npm run build`: PASS.

## Riesgos Y Pendientes

- No existe todavia pantalla administrativa completa para asignar asesorias pendientes a asesores.
- Comentarios de asesorias siguen documentados como relacion no funcional.
- No hay reapertura de asesoria resuelta.
- No hay edicion posterior de tipo final o descripcion final.
- `solicitudes_servicio.descripcion_problema` permite 255 caracteres; por eso la descripcion final enviada a resolucion se limita a 255 para crear el servicio sin truncar.
- No se implementan resenas en esta fase.

## Reversion

Backup para restaurar estado previo:

```text
database/backups/futurapp_before_advisory_resolution_20260616_100756.sql
```

Consideraciones:

- Revertir codigo restaura endpoints/UI previos.
- Revertir SQL requiere restaurar backup si ya existen asesorias relacionadas con servicios.
- No se recomienda eliminar manualmente `id_solicitud_servicio` si hay servicios generados, porque se perderia trazabilidad.
- Los servicios ya generados desde asesorias son solicitudes reales; si se revierte funcionalidad, deben revisarse manualmente antes de limpiar datos de prueba.
