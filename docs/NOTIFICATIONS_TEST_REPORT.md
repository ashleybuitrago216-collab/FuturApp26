# Reporte de Pruebas de Notificaciones

Fecha de ejecucion: 2026-06-15  
Base API: `http://localhost:4000/api`  
Base de datos: `futurapp` via Prisma/MySQL  
Script: `server/scripts/test-notifications-flow.js --start-server`  
Prefijo de datos de prueba: `PRUEBA_NOTIFICACIONES_`

## Diagnostico Inicial

La prueba prioritaria U01 fallo antes de la correccion porque `POST /api/services` ejecutaba `servicesService.create`, creaba la solicitud y solo llamaba a `crearNotificacionSistemaSegura` para el usuario propietario:

- Titulo personal: `Solicitud creada`
- Destinatario: `id_usuario` del usuario creador

No existia llamada a `notificarAdministradores` ni `notificarAdministradoresSeguro`, por lo que no se buscaban administradores activos ni se creaba una copia por administrador.

La consulta usa MySQL via Prisma. El tipo `servicio` se resuelve con el catalogo existente `Solicitud Creada`. La transaccion de creacion de solicitud no impedia las notificaciones: el problema era ausencia de emision administrativa despues del `create`.

## Administradores Activos

Antes de crear usuarios de prueba habia 2 administradores activos canonicos en MySQL:

- `id_usuario=10`
- `id_usuario=14`

El script agrego 2 administradores controlados para validar bandeja por API:

- Admin A: `id_usuario=17`
- Admin B: `id_usuario=18`

Total durante la suite: 4 administradores activos. Cada evento administrativo debia crear 4 notificaciones.

## IDs Creados

- Usuarios de prueba: admin A `17`, admin B `18`, usuario `19`, tecnico `20`.
- Solicitudes: `26`, `27`, `28`, `29`, `30`, `31`, `32`, `33`.
- Citas: `24`, `25`, `26`, `27`, `28`.
- Pagos: `20`, `21`, `22`, `23`.
- Notificaciones destacadas: `149-152`, `158-161`, `172-175`, `206-209`, `228-232`, `234-237`.

Los datos no fueron eliminados para preservar trazabilidad. Todos usan usuarios, descripciones o mensajes con prefijo `PRUEBA_NOTIFICACIONES_`.

## Matriz

| ID | Evento | Emisor | Destinatarios esperados | Resultado inicial | Error encontrado | Correccion aplicada | Resultado final |
| -- | ------ | ------ | ----------------------- | ----------------- | ---------------- | ------------------- | --------------- |
| U01 | Nueva solicitud | Usuario `19` | Admins `10,14,17,18` | FAIL | `servicesService.create` no notificaba administradores | Se agrego `notificarAdministradoresSeguro` despues de crear solicitud | PASS |
| U02 | Cancelacion de solicitud | Usuario `19` | Admins `10,14,17,18` | FAIL | `servicesService.cancel` no notificaba administradores | Se agrego alerta administrativa tras cancelar | PASS |
| U03 | Pago simulado realizado | Usuario `19` | Admins `10,14,17,18`, usuario y tecnico personales | FAIL | `paymentsService.initiate` notificaba usuario/tecnico, no admins | Se agrego `Pago realizado` para administradores | PASS |
| U04 | Comentario/incidencia usuario | Usuario | Segun incidencia | No ejecutable | No existe endpoint POST de comentarios/incidencias | Documentado como no implementado | NO_EJECUTABLE |
| U05 | Resena negativa | Usuario | Admins activos | No ejecutable | No existe ruta API de resenas | Documentado como no implementado | NO_EJECUTABLE |
| T01 | Confirmacion correcta pago | Tecnico `20` | Usuario personal; sin revision admin | PASS | Ninguno | Validacion sin cambio | PASS |
| T02 | Primer desacuerdo pago | Tecnico `20` | Sin alerta admin definitiva | PASS | Ninguno | Validacion sin cambio | PASS |
| T03 | Segundo desacuerdo pago | Tecnico `20` | Admins `10,14,17,18` | PASS tras correccion previa | Mensaje/referencia necesitaban quedar claros | Se ajusto mensaje con `pago #id` y evento/referencia | PASS |
| T04 | Tecnico indisponible | Tecnico | Admins activos | No ejecutable | No existe endpoint de indisponibilidad | Documentado como no implementado | NO_EJECUTABLE |
| T05 | Incidencia tecnico | Tecnico | Admins activos | No ejecutable | No existe endpoint de incidencia tecnica | Documentado como no implementado | NO_EJECUTABLE |
| T06 | Servicio finalizado | Tecnico | Usuario/admins segun regla | No ejecutable | No existe endpoint para finalizar por tecnico | Documentado como no implementado | NO_EJECUTABLE |
| S01 | Servicio sin tecnico | Sistema | Admins activos | No ejecutable | No existe scheduler/cron | Documentado como pendiente | NO_EJECUTABLE |
| S02 | Cita sin programar | Sistema | Admins activos | No ejecutable | No existe scheduler/cron | Documentado como pendiente | NO_EJECUTABLE |
| S03 | Tecnico asignado | Admin `17` | Usuario `19`, tecnico `20` | PASS | Ninguno | Validacion sin cambio | PASS |
| S04 | Cita programada | Admin `17` | Usuario `19`, tecnico `20` | PASS | Ninguno | Validacion sin cambio | PASS |
| N01 | Bandeja personal | Admin `17` | Cada usuario solo su bandeja | PASS | Ninguno | Regla `id_usuario=req.user.id` validada | PASS |
| N02 | Contador no leido | Todos | Coincide con visibles | PASS | Ninguno | Conteo propietario validado | PASS |
| N03 | Lectura cruzada | Admin `17` | 403 sobre notificacion de usuario | PASS | Ninguno | Propietario obligatorio validado | PASS |
| N04 | Marcar todas | Admin `18` | Solo propias | PASS | Ninguno | `updateMany` propietario validado | PASS |
| N05 | Creacion manual | Admin `17` para usuario `19` | Solo usuario destino | PASS | Ninguno | Separacion crear vs bandeja validada | PASS |
| N06 | Multiples admins | Usuario `19` | 4 copias admin | PASS | Ninguno | Helper crea una fila por admin activo | PASS |
| NR | No regresion | Varios | Endpoints principales 2xx | PASS | Ninguno | Verificacion posterior | PASS |

## Detalles Por Caso

### U01 - Nueva solicitud de servicio

- Request: `POST /api/services`
- Servicio: `26`
- Administradores encontrados: `4`
- Esperadas: `4`
- Creadas: `4`
- Destinatarios: `10,14,17,18`
- Notificaciones: `149,150,151,152`
- Contador antes: `10=0`, `14=0`, `17=0`, `18=0`
- Contador despues: `10=1`, `14=1`, `17=1`, `18=1`
- Usuario y tecnico no recibieron la alerta administrativa.

### U02 - Cancelacion de solicitud

- Request: `PATCH /api/services/27/cancel`
- HTTP: `200`
- Servicio: `27`
- Administradores encontrados: `4`
- Esperadas/creadas: `4/4`
- Destinatarios: `10,14,17,18`
- Notificaciones: `158,159,160,161`
- Contador antes: `10=2`, `14=2`, `17=2`, `18=2`
- Contador despues: `10=3`, `14=3`, `17=3`, `18=3`

### U03 - Pago simulado realizado

- Request: `POST /api/payments/20/initiate`
- HTTP: `200`
- Servicio: `28`
- Cita: `24`
- Pago: `20`
- Administradores encontrados: `4`
- Esperadas/creadas: `4/4`
- Destinatarios: `10,14,17,18`
- Notificaciones admin: `172,173,174,175`
- Confirmacion usuario: `1`
- Confirmacion tecnico: `1`
- Contador antes: `10=4`, `14=4`, `17=4`, `18=4`
- Contador despues: `10=5`, `14=5`, `17=5`, `18=5`

### T01 - Confirmacion correcta de pago

- Request: `POST /api/payments/21/confirm-technician`
- HTTP: `200`
- Servicio: `29`
- Cita: `25`
- Pago: `21`
- `requiresAdminReview=false`
- Confirmacion usuario: `1`
- Alertas admin de revision: `0`

### T02 - Primer desacuerdo

- Request: `POST /api/payments/22/confirm-technician`
- HTTP: `409`
- Codigo: `PAYMENT_METHOD_MISMATCH`
- Servicio: `30`
- Cita: `26`
- Pago: `22`
- Alertas admin de revision: `0`

### T03 - Segundo desacuerdo

- Request: `POST /api/payments/22/confirm-technician`
- HTTP: `200`
- `requiresAdminReview=true`
- Administradores encontrados: `4`
- Esperadas/creadas: `4/4`
- Destinatarios: `10,14,17,18`
- Notificaciones: `206,207,208,209`
- Contador antes: `10=9`, `14=9`, `17=9`, `18=9`
- Contador despues: `10=10`, `14=10`, `17=10`, `18=10`

### S03 - Tecnico asignado

- Request: `PATCH /api/services/31`
- HTTP: `200`
- Servicio: `31`
- Cita: `27`
- Usuario recibio `Tecnico asignado`: `1`
- Tecnico recibio `Servicio asignado`: `1`
- No se creo alerta global admin para esta accion administrativa.

### S04 - Cita programada

- Request: `PATCH /api/appointments/28/schedule`
- HTTP: `200`
- Servicio: `32`
- Cita: `28`
- Pago: `23`
- Usuario recibio `Cita programada`: `1`
- Tecnico recibio `Cita programada`: `1`

### N01 - Bandeja personal

- Request: `GET /api/notifications`
- Notificaciones manuales: `228,229,230,231`
- Foreign counts: admin A `0`, admin B `0`, usuario `0`, tecnico `0`

### N02 - Contador no leido

- Request: `GET /api/notifications/unread-count`
- API: admin A `13`, admin B `13`, usuario `24`, tecnico `10`
- Visibles no leidas: admin A `13`, admin B `13`, usuario `24`, tecnico `10`

### N03 - Lectura cruzada

- Request: `PATCH /api/notifications/230/read`
- Emisor: admin A
- Notificacion pertenece a usuario
- HTTP: `403`

### N04 - Marcar todas

- Request: `PATCH /api/notifications/read-all`
- Emisor: admin B
- HTTP: `200`
- Antes: admin B `13`, usuario `24`
- Despues: admin B `0`, usuario `24`

### N05 - Creacion manual

- Request: `POST /api/notifications`
- Emisor: admin A
- Destino: usuario `19`
- HTTP: `201`
- Notificacion: `232`
- La ve el usuario; no aparece en bandeja del admin creador.

### N06 - Multiples administradores

- Request: `POST /api/services`
- Servicio: `33`
- Administradores encontrados: `4`
- Notificaciones creadas: `4`
- Destinatarios unicos: `4`
- Notificaciones: `234,235,236,237`

## Validaciones Tecnicas

- `node --check server/src/modules/notifications/notifications.service.js`: PASS
- `node --check server/src/modules/services/services.service.js`: PASS
- `node --check server/src/modules/payments/payments.service.js`: PASS
- `node --check server/scripts/test-notifications-flow.js`: PASS
- `npx prisma validate`: PASS
- `npx prisma generate`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS

## Tipos De Notificacion

Catalogo actual:

- `Solicitud Creada`
- `Cita Confirmada`
- `Pago Recibido`
- `Recordatorio de Cita`
- `Comentario Nuevo`

No se crearon tipos nuevos. Los aliases actuales resuelven `servicio`, `pago`, `cita`, `comentario` y `sistema` sobre el catalogo existente. Faltan tipos explicitos `Resena`, `Sistema` y `Seguridad`; no fueron agregados porque no son indispensables para los endpoints probados y no se solicito migracion/catalogo manual.

## Limitacion De Deduplicacion

El schema `notificaciones` no tiene columnas para `evento`, `referencia_tipo` ni `referencia_id`. El helper acepta esos campos y los devuelve en su resumen, pero la deduplicacion persistente se hace con los campos disponibles:

- destinatario (`id_usuario`)
- tipo de notificacion (`id_tipo_notificacion`)
- titulo
- mensaje

Por esta razon, los mensajes administrativos incluyen el ID real de la referencia (`solicitud #id` o `pago #id`). No se agregaron columnas sin backup ni SQL manual revisable.

## Riesgos Pendientes

- Hay usuarios historicos con roles inconsistentes; por ejemplo `admin@futurapp.com` aparece con rol `Tecnico` en MySQL. Las alertas usan el rol canonico real de la tabla `roles`.
- No existen endpoints para crear comentarios/incidencias, resenas, indisponibilidad tecnica ni finalizacion tecnica.
- No existe scheduler/cron para alertas automaticas de servicios sin tecnico o citas sin programar.
- Prisma mantiene advertencia de configuracion `package.json#prisma` deprecada para Prisma 7.
