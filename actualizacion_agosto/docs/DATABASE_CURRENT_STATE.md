# FuturApp - Estado Actual de Base de Datos

Fecha de auditoria: 2026-06-16

## Base Oficial

- Motor: MySQL/MariaDB con XAMPP.
- Base oficial: `futurapp`.
- Conexion backend: `DATABASE_URL="mysql://root:@localhost:3306/futurapp"`.
- Health check validado: `GET /api/health` responde `database: connected`.

## Tablas Actuales

| Tabla | Registros |
|---|---:|
| `_prisma_migrations` | 3 |
| `areas_especialidad` | 4 |
| `asesorias` | 14 |
| `ayudas` | 0 |
| `citas` | 29 |
| `comentarios` | 5 |
| `equipos` | 5 |
| `estados` | 5 |
| `estados_pago` | 5 |
| `medios_pago` | 9 |
| `notificaciones` | 317 |
| `pagos` | 24 |
| `prioridades` | 5 |
| `reportes` | 0 |
| `recuperaciones_contrasena` | 2 |
| `resenas` | 0 |
| `respuestas_comentarios` | 5 |
| `roles` | 4 |
| `solicitudes_servicio` | 38 |
| `tipos_documento` | 5 |
| `tipos_notificacion` | 5 |
| `tipos_servicio` | 5 |
| `ubicaciones_tecnicos` | 5 |
| `usuarios` | 43 |
| `verificaciones_pago` | 14 |

No existen tablas `legacy_*` ni `empleados` en la base oficial.

## Verificacion De Pagos

La tabla `verificaciones_pago` existe y conserva la auditoria separada del estado financiero de `pagos`.

Campos principales:

- `id_verificacion_pago`: PK.
- `id_pago`: FK a `pagos.id_pago` y unique.
- `id_usuario_tecnico`: FK a `usuarios.id_usuario`.
- `id_medio_pago_tecnico`: FK a `medios_pago.id_medio_pago`.
- `cantidad_intentos`.
- `metodos_coinciden`.
- `requiere_revision`.
- `observacion`.
- `fecha_primer_intento`.
- `fecha_confirmacion`.

Cuando la confirmacion del tecnico detecta inconsistencia de metodo y marca `requiere_revision = true`, el backend crea una notificacion administrativa separada para cada administrador activo. No se reutilizan las notificaciones personales del cliente o del tecnico para mostrarlas al admin.

## Recuperacion De Contrasena

La base incluye la tabla `recuperaciones_contrasena`, creada con SQL manual aditivo en `database/migrations/manual/012_recuperacion_contrasena.sql`.

Funcion:

- Guardar solicitudes de recuperacion de contrasena.
- Asociar cada token a un usuario.
- Guardar solo `token_hash`, nunca el token plano.
- Controlar expiracion y uso unico.

Campos principales:

- `id_recuperacion`: PK.
- `id_usuario`: FK a `usuarios.id_usuario`.
- `token_hash`: SHA-256 del token.
- `fecha_expiracion`: vencimiento del enlace.
- `usado`: indica si el token ya fue consumido.
- `fecha_uso`.
- `fecha_creacion`.

Relacion:

- `recuperaciones_contrasena.id_usuario` -> `usuarios.id_usuario`.

## Regla Actual De Montos Y Pagos

El rol `admin` ya no define montos al asignar tecnico ni al programar citas. La tabla `pagos` y la columna `monto` se conservan para historicos y para el flujo formal de pagos, pero el backend no crea pagos automaticos cuando no existe un valor definido.

Los servicios pueden existir sin pago generado. En ese caso, los listados deben tratar el pago como pendiente de definicion y no deben asumir que toda cita o asignacion tecnica tiene un registro en `pagos`.

No se aplicaron cambios estructurales de base de datos para esta regla.

## Cotizaciones

La base ahora incluye la tabla `cotizaciones`, creada por SQL manual aditivo en `database/migrations/manual/011_cotizaciones_servicio.sql`.

Funcion:

- Registrar el valor propuesto por el tecnico para un servicio asignado.
- Permitir aprobacion o rechazo por parte del usuario.
- Crear y relacionar un pago pendiente solo cuando la cotizacion se aprueba.

Relaciones:

- `cotizaciones.id_solicitud_servicio` -> `solicitudes_servicio.id_solicitud_servicio`.
- `cotizaciones.id_usuario_cliente` -> `usuarios.id_usuario`.
- `cotizaciones.id_usuario_tecnico` -> `usuarios.id_usuario`.
- `cotizaciones.id_pago` -> `pagos.id_pago`.

Restricciones:

- Una cotizacion por servicio en esta fase mediante `UNIQUE(id_solicitud_servicio)`.
- Una cotizacion genera como maximo un pago mediante `UNIQUE(id_pago)`.

Estados funcionales: `Enviada`, `Aprobada`, `Rechazada`, `Cancelada`.

## Servicio Completado Y Habilitacion De Pago

La tabla `estados` conserva el valor `Finalizado`, usado internamente para representar un servicio completado. Los mappers de la API lo exponen como `Completado` para la interfaz.

No se agregaron columnas ni tablas para esta fase.

Regla actual:

- El tecnico asignado marca el servicio como completado con `PATCH /api/services/:id/complete`.
- El servicio cambia a `estados.nombre_estado = Finalizado`.
- La cita relacionada tambien queda en estado `Finalizado` y `confirmada = true`.
- El pago pendiente creado al aprobar cotizacion no se puede iniciar hasta que el servicio este completado.
- Completar el servicio no crea pagos nuevos ni modifica montos existentes.

## Notificaciones

La bandeja de notificaciones es personal para todos los roles:

- `GET /api/notifications` filtra siempre por `notificaciones.id_usuario = req.user.id`.
- `GET /api/notifications/unread-count` cuenta solo `id_usuario = req.user.id` y `leida = false`.
- `PATCH /api/notifications/:id/read` solo permite marcar una notificacion propia; si existe pero pertenece a otro usuario responde 403.
- `PATCH /api/notifications/read-all` actualiza solo notificaciones propias no leidas.
- Ser `admin` no convierte la bandeja personal en una vista global.
- Los eventos administrativos crean registros separados dirigidos expresamente a administradores activos.
- Actualmente notifican a administradores: nueva solicitud de servicio, cancelacion de solicitud, pago realizado y revision de pago por segundo desacuerdo.
- El schema no tiene columnas `evento`, `referencia_tipo` ni `referencia_id`; la deduplicacion usa destinatario, tipo, titulo y mensaje, y el mensaje incluye el ID real de solicitud o pago.
- El detalle de pruebas esta en `docs/NOTIFICATIONS_TEST_REPORT.md`.

## Catalogos

Roles funcionales:

- `Administrador` -> `admin`.
- `Tecnico` -> `tecnico`.
- `Usuario` -> `usuario`.
- `Asesor` -> `asesor`.

La tabla `roles` fue normalizada y ya no contiene `Cliente`, `Soporte`, `Visitante` ni variantes con tilde.

## Asesorias

La fase 1 del modulo Asesoria usa la tabla existente `asesorias` y conserva sus columnas legacy. Se agregaron columnas aditivas para separar solicitante y asesor:

- `id_usuario_solicitante`: FK a `usuarios.id_usuario`.
- `id_usuario_asesor`: FK a `usuarios.id_usuario`.
- `fecha`.
- `hora`.
- `estado`.
- `motivo`.
- `descripcion`.
- `fecha_creacion`.
- `tipo_dispositivo`.
- `telefono_principal`.
- `telefono_alterno`.
- `id_tipo_servicio`: FK opcional a `tipos_servicio.id_tipo_servicio`.
- `descripcion_servicio_final`.
- `id_solicitud_servicio`: FK opcional y unica a `solicitudes_servicio.id_solicitud_servicio`, usada cuando una asesoria resuelta genera un servicio real.
- `fecha_actualizacion`.

El asesor es un usuario normal con rol `Asesor`; no existe tabla `asesores`.

Endpoint operativo:

- `POST /api/advisories`: solo rol `usuario`, crea solicitud con `estado = Pendiente`, asesor y servicio final en `NULL`.
- `GET /api/advisories`: role-aware; admin ve todas, asesor ve asignadas y usuario ve solicitadas.
- `GET /api/advisories/:id`: admin puede ver todas; asesor asignado y usuario solicitante solo ven las propias.
- `GET /api/advisories/:id/comments`: estado vacio documentado porque `comentarios` aun no tiene `id_asesoria`.
- `GET /api/advisories/catalogs`: asesor ve tipos de servicio; admin ve tipos de servicio y asesores activos con carga.
- `PATCH /api/advisories/:id/assign`: solo admin, asigna o reasigna asesor activo si la asesoria no esta resuelta.
- `PATCH /api/advisories/:id/resolve`: solo asesor asignado, resuelve asesoria pendiente y crea solicitud de servicio en transaccion.

Actualizacion 2026-06-18:

- `telefono_principal` y `telefono_alterno` permanecen en la tabla por compatibilidad historica.
- Ambos campos son `NULL` en MySQL y opcionales en Prisma.
- El formulario nuevo de usuario ya no envia telefonos.
- `POST /api/advisories` no exige telefono principal.
- Si un cliente antiguo envia telefonos, se aceptan como opcionales y se normalizan.
- El contacto visible para asesor/admin se toma desde `usuarios.telefono`.
- No se requirio migracion manual ni dump posterior por no haber cambio estructural.

Actualizacion 2026-06-22:

- La asesoria no se considera tipo de servicio tecnico.
- `tipos_servicio` no tiene campo `activo`, `categoria` ni `es_servicio_tecnico`; por eso se aplica filtro backend por nombre normalizado.
- El catalogo de `GET /api/advisories/catalogs` para rol asesor excluye nombres como `Asesoria`, `Asesorias`, `Orientacion` y `Consulta`.
- `PATCH /api/advisories/:id/resolve` valida que el `id_tipo_servicio` exista y sea tecnico.
- Los servicios generados desde asesoria conservan `solicitudes_servicio.id_tipo_servicio`.
- `GET /api/services` expone `advisoryOriginId` / `asesoriaOrigenId` para servicios originados en asesorias.
- `PATCH /api/services/:id` bloquea cambio de tipo cuando existe asesoria de origen.
- No se aplico migracion estructural.

La resolucion de asesoria:

- guarda `id_tipo_servicio`;
- guarda `descripcion_servicio_final`;
- cambia `estado` a `Asesoria resuelta`;
- crea un registro real en `solicitudes_servicio`;
- guarda `id_solicitud_servicio`;
- no crea tecnico, cita, pago ni monto;
- notifica al usuario, al asesor y a cada administrador activo.

La relacion agregada en fase de resolucion es:

```text
asesorias.id_solicitud_servicio
  -> solicitudes_servicio.id_solicitud_servicio
```

Constraint:

```text
uq_asesorias_solicitud_servicio
fk_asesorias_solicitud_servicio
```

Pruebas:

```text
server/scripts/test-advisory-resolution-flow.js --start-server
```

Resultado validado: AR01-AR18 PASS.

Prueba de gestion administrativa:

```text
server/scripts/test-advisory-admin-assignment-flow.js --start-server
```

Resultado validado: AA01-AA12 PASS.

Datos demo:

- Asesor: `asesor@futurapp.com` / `123456`.
- Asesoria demo creada por `server/scripts/seed-advisory-phase1.js`.
- Solicitudes de usuario probadas por `server/scripts/test-advisory-user-flow.js`.

Estados de pago:

- `Pendiente de Pago`.
- `Pagado`.
- `Fallido`.
- `Reembolsado`.
- `En Revisión`.

Medios de pago disponibles:

- `Tarjeta de Crédito`.
- `Transferencia Bancaria`.
- `Pago en Efectivo`.
- `PayPal`.
- `Criptomonedas`.
- `Nequi`.
- `DaviPlata`.
- `Bancolombia`.
- `Tarjeta`.

## Usuarios Demo

| Rol | Correo | Contrasena | Estado |
|---|---|---|---|
| Admin | `admin@futurapp.com` | `123456` | Activo, bcrypt validado |
| Tecnico | `tecnico@futurapp.com` | `123456` | Activo, bcrypt validado |
| Usuario | `usuario@futurapp.com` | `123456` | Activo, bcrypt validado |

## Gestion De Usuarios Admin

La administracion de usuarios usa las tablas oficiales:

- `usuarios`
- `roles`
- `areas_especialidad`
- `citas`

Mapeo Prisma usado por la API:

- `Usuario.idUsuario` -> `id` / `idUsuario`
- `Usuario.idRol` -> `idRol`
- `Usuario.idAreaEspecialidad` -> `idAreaEspecialidad`
- `Usuario.activo` -> `activo`
- `Usuario.rol.nombreRol` -> `rolNombre` y rol normalizado (`admin`, `tecnico`, `usuario`)
- `Usuario.areaEspecialidad.nombreAreaEspecialidad` -> `areaEspecialidad.nombre`

Endpoints relacionados:

- `GET /api/users`: lista usuarios reales, solo admin.
- `GET /api/users/catalogs`: devuelve roles y areas, solo admin.
- `PATCH /api/users/:id/admin`: actualiza rol, area y estado, solo admin.
- `GET /api/users/technicians`: devuelve tecnicos activos reales.

Reglas persistentes:

- El rol tecnico requiere `id_area_especialidad` valido.
- Si un usuario deja de ser tecnico, `id_area_especialidad` queda en `NULL`.
- Un tecnico inactivo no aparece en el selector de servicios.
- Un tecnico con citas activas no puede ser degradado ni desactivado hasta reasignar esas citas.
- El ultimo administrador activo no puede ser degradado ni desactivado.
- No se usa tabla `empleados`.

## Foreign Keys e Indices

- La auditoria final registro 36 foreign keys.
- `citas.id_solicitud_servicio` tiene unicidad para evitar duplicar cita por solicitud.
- `verificaciones_pago.id_pago` tiene unicidad para una verificacion activa por pago.
- `usuarios.correo` es unico.
- Catalogos principales usan claves unicas en sus nombres cuando aplica.

## Diferencias Contra Prisma

`server/prisma/schema.prisma` valida correctamente con Prisma y contiene el modelo `VerificacionPago` mapeado a `verificaciones_pago`.

No se detectaron usos funcionales obsoletos en backend/frontend para:

- `prisma.user`
- `prisma.service`
- `prisma.appointment`
- `prisma.payment`
- `prisma.comment`
- `prisma.technicianLocation`
- `prisma.empleado`

Las referencias a `legacy_*` existen solo en migraciones manuales antiguas de limpieza y backups historicos.

## Riesgos

- Existen bases no oficiales como `futurapp_prueba_importacion_final` para prueba de importacion; no debe usarse como `DATABASE_URL`.
- `GET /api/users`, `GET /api/comments` y `GET /api/locations` siguen expuestos segun la arquitectura documentada previamente.
- El dump final incluye datos de prueba creados durante validacion funcional.
