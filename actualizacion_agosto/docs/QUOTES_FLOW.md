# Flujo De Cotizacion Y Generacion De Pago

## Motivo

El administrador ya no define montos economicos al asignar tecnico o programar citas. Para crear pagos con valor real, FuturApp incorpora un flujo separado de cotizacion:

```text
Tecnico asignado
↓
Tecnico propone valor
↓
Usuario aprueba o rechaza
↓
Solo si aprueba se crea pago pendiente
```

## Base De Datos

Se agrego la tabla `cotizaciones` mediante SQL manual aditivo:

- SQL: `database/migrations/manual/011_cotizaciones_servicio.sql`
- Backup previo: `database/backups/futurapp_before_quotes_flow_20260622_213006.sql`

Campos principales:

| Campo | Funcion |
|---|---|
| `id_cotizacion` | Identificador |
| `id_solicitud_servicio` | Servicio cotizado |
| `id_usuario_cliente` | Usuario que debe aprobar/rechazar |
| `id_usuario_tecnico` | Tecnico que propone el valor |
| `id_pago` | Pago generado solo al aprobar |
| `monto` | Valor propuesto |
| `descripcion` | Detalle de la cotizacion |
| `estado` | `Enviada`, `Aprobada`, `Rechazada`, `Cancelada` |

Restricciones:

- `UNIQUE(id_solicitud_servicio)`: una cotizacion por servicio en esta fase.
- `UNIQUE(id_pago)`: una cotizacion genera como maximo un pago.
- FK a `solicitudes_servicio`, `usuarios` y `pagos`.

## Endpoints

| Metodo | Ruta | Rol | Funcion |
|---|---|---|---|
| `POST` | `/api/quotes` | `tecnico` | Crear cotizacion para servicio asignado |
| `GET` | `/api/quotes` | `usuario`, `tecnico`, `admin` | Listar cotizaciones segun rol |
| `GET` | `/api/quotes/:id` | Participantes o admin | Ver detalle |
| `POST` | `/api/quotes/:id/approve` | `usuario` dueño | Aprobar y crear pago pendiente |
| `POST` | `/api/quotes/:id/reject` | `usuario` dueño | Rechazar sin crear pago |

## Permisos

- `tecnico`: puede crear cotizacion solo para servicios asignados a el.
- `usuario`: puede ver, aprobar o rechazar solo sus cotizaciones.
- `admin`: puede ver todas, pero no crear, aprobar, rechazar ni modificar monto.
- `asesor`: no participa en cotizaciones.

## Relacion Con Pagos

La tabla `pagos` no se usa como propuesta. El pago se crea solamente cuando el usuario aprueba una cotizacion `Enviada`.

Al aprobar:

1. Se valida que la cotizacion pertenezca al usuario.
2. Se valida estado `Enviada`.
3. Se valida que no exista `id_pago`.
4. Se valida que el servicio tenga cita/asignacion tecnica.
5. Se crea `pagos` con estado `Pendiente`.
6. Se actualiza `cotizaciones.estado = 'Aprobada'`.
7. Se guarda `cotizaciones.id_pago`.

Todo ocurre dentro de una transaccion Prisma.

## Frontend

En `ServiciosPage.jsx`:

- Tecnico ve accion `Proponer valor`.
- Usuario ve acciones `Aprobar cotizacion` y `Rechazar cotizacion` cuando el estado es `Enviada`.
- Admin ve estado de cotizacion y pago en el listado, sin campo editable de monto.

## Notificaciones

- Cotizacion enviada: notifica al usuario.
- Cotizacion aprobada: notifica al tecnico y administradores.
- Cotizacion rechazada: notifica al tecnico y administradores.

## Pruebas

Script:

```powershell
node server\scripts\test-quotes-flow.js --start-server
```

Resultado final:

| ID | Resultado |
|---|---|
| QF01 | PASS |
| QF02 | PASS |
| QF03 | PASS |
| QF04 | PASS |
| QF05 | PASS |
| QF06 | PASS |
| QF07 | PASS |
| QF08 | PASS |
| QF09 | PASS |
| QF10 | PASS |
| QF11 | PASS |
| QF12 | PASS |
| QF13 | PASS |
| QF14 | PASS |
| QF15 | PASS |
| QF16 | PASS |
| QF17 | PASS |
| QF18 | PASS |

Ultima ejecucion:

- Usuarios: admin `58`, usuario `59`, tecnico `60`, tecnico ajeno `61`, asesor `62`.
- Servicios: `76`, `77`, `78`.
- Cotizaciones: `22`, `23`, `24`.
- Pago generado: `40`.
- Cita: `60`.

## Riesgos Y Pendientes

- No hay edicion de cotizacion enviada.
- No hay vencimiento automatico de cotizaciones.
- No hay historial de varias cotizaciones por servicio; esta fase usa una unica cotizacion por servicio.
- Reportes financieros deben diferenciar servicios sin cotizacion, cotizacion enviada, aprobada o rechazada.
- Las reglas de comision siguen calculandose en pagos, no en cotizaciones.

## Reversion

Para revertir datos estructurales, usar el backup previo y revisar manualmente cualquier pago generado desde cotizacion. Si ya hubo pagos aprobados, no se debe eliminar informacion historica sin una decision funcional explicita.

