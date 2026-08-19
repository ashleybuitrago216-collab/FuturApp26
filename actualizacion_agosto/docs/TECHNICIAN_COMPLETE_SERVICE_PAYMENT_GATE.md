# Servicio Completado Por Tecnico Y Habilitacion De Pago

Fecha: 2026-06-23

## Regla De Negocio

El usuario no puede iniciar un pago hasta que el tecnico asignado marque el servicio como completado.

El flujo queda asi:

```text
Admin asigna tecnico
Tecnico propone cotizacion
Usuario aprueba cotizacion
Se crea pago pendiente
Tecnico marca servicio como completado
Usuario puede pagar
Tecnico confirma pago
```

## Estado Usado

La base de datos ya contiene el estado `Finalizado` en la tabla `estados`. El backend lo usa como valor persistido para servicios completados y los mappers lo exponen al frontend como `Completado`.

No se agregaron columnas ni tablas.

## Endpoint Nuevo

```http
PATCH /api/services/:id/complete
```

Acceso:

- Solo `tecnico`.
- El servicio debe estar asignado al tecnico autenticado mediante la cita relacionada.
- No se permite completar servicios ajenos.
- No se permite completar servicios cancelados.
- No se permite completar servicios ya completados.

Payload opcional:

```json
{
  "observacionFinal": "Servicio realizado correctamente."
}
```

La observacion final se acepta para compatibilidad de interfaz, pero no se persiste porque la base actual no tiene columna de observaciones finales del servicio.

## Pagos

Se eligio mantener la compatibilidad con el flujo de cotizaciones existente:

- Al aprobar una cotizacion se sigue creando un pago pendiente.
- Ese pago queda visible como pendiente.
- `POST /api/payments/:id/initiate` rechaza el pago si el servicio no esta completado.
- Al completar el servicio no se crea un pago nuevo.
- No se modifica el monto.
- No se duplica `pagos`.

Mensaje de bloqueo:

```text
El pago estara disponible cuando el tecnico marque el servicio como completado.
```

## Frontend

### Tecnico

En `src/pages/ServiciosPage.jsx` se agrega la accion `Marcar como completado` para servicios asignados al tecnico autenticado, siempre que no esten `Completado` ni `Cancelado`.

La accion pide confirmacion antes de llamar:

```http
PATCH /api/services/:id/complete
```

### Usuario

En `src/pages/PagosPage.jsx`, si existe un pago pendiente con monto valido pero el servicio no esta completado, el boton `Pagar` no se muestra y se presenta el motivo de bloqueo.

### Admin

El administrador ve el estado `Completado`, pero no recibe accion para completar el servicio. La edicion general de servicios ya no permite enviar el estado final; si un cliente antiguo lo intenta, el backend responde `403`.

## Archivos Modificados

Backend:

- `server/src/modules/services/services.routes.js`
- `server/src/modules/services/services.controller.js`
- `server/src/modules/services/services.service.js`
- `server/src/modules/services/services.mapper.js`
- `server/src/modules/payments/payments.service.js`
- `server/src/modules/payments/payments.mapper.js`

Frontend:

- `src/pages/ServiciosPage.jsx`
- `src/pages/PagosPage.jsx`
- `src/domains/services/services/servicesApi.js`
- `src/domains/services/services/serviceMappers.js`
- `src/domains/payments/services/paymentMappers.js`

Pruebas:

- `server/scripts/test-technician-complete-service-payment-gate.js`

## Pruebas Ejecutadas

Comando:

```powershell
node server\scripts\test-technician-complete-service-payment-gate.js --start-server
```

Resultado:

| ID | Caso | Resultado |
|---|---|---|
| CS01 | Tecnico ve servicio asignado | PASS |
| CS02 | Tecnico completa servicio valido | PASS |
| CS03 | Tecnico ajeno no completa | PASS |
| CS04 | Usuario no completa | PASS |
| CS05 | Admin no completa | PASS |
| CS06 | Asesor no completa | PASS |
| CS07 | No completar cancelado | PASS |
| CS08 | No completar ya completado | PASS |
| CS09 | Usuario no paga antes de completar | PASS |
| CS10 | Usuario paga despues de completar | PASS |
| CS11 | No se duplica pago al completar | PASS |
| CS12 | Cotizacion rechazada no permite pago aunque servicio este completado | PASS |
| CS13 | Servicio sin cotizacion aprobada no permite pago | PASS |
| CS14 | Tecnico confirma pago despues de pago valido | PASS |
| CS15 | Admin ve estado completado | PASS |
| CS16 | No regresion de asesorias | PASS |
| CS17 | No regresion de cotizaciones | PASS |
| CS18 | No regresion general | PASS |

IDs principales creados por la prueba:

- Usuarios: admin `67`, usuario `68`, tecnico `69`, tecnico ajeno `70`, asesor `71`.
- Servicios: `84`, `85`, `86`, `87`, `88`, `89`.
- Cotizaciones: `27`, `28`, `29`.
- Pagos: `43`, `44`.
- Citas: `66`, `67`, `68`, `69`, `71`.
- Asesoria: `31`.

## Validaciones Tecnicas

- `npx.cmd prisma validate`: PASS.
- `npx.cmd prisma generate`: PASS despues de detener procesos Node del proyecto que bloqueaban el motor de Prisma.
- `node --check` en backend y script: PASS.

## Riesgos Y Pendientes

- No existe persistencia de observacion final del tecnico.
- Falta evidencia de finalizacion del trabajo, por ejemplo fotos o archivos.
- No existe confirmacion posterior del usuario sobre satisfaccion del servicio.
- No existe reapertura de servicio completado.
- Los reportes de servicios completados pueden ampliarse en una fase posterior.
