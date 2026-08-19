# Eliminacion De Asignacion De Monto Desde Admin

## Objetivo

El rol `admin` ya no define valores economicos al gestionar servicios o citas. El administrador conserva las acciones operativas de asignar tecnico, reasignar tecnico, programar cita y consultar pagos historicos, pero no puede ingresar, enviar ni modificar montos desde estos flujos.

## Diagnostico

Se revisaron los modulos de servicios, citas y pagos en frontend y backend.

Antes del ajuste:

- `src/pages/ServiciosPage.jsx` mostraba un campo de monto en la asignacion de tecnico.
- `src/pages/CitasPage.jsx` mostraba un campo de monto al programar cita.
- `src/domains/appointments/services/appointmentMappers.js` enviaba `monto` en el payload de programacion.
- `src/domains/services/services/serviceMappers.js` podia convertir `form.monto` en `serviceAmount`.
- `server/src/modules/services/services.service.js` creaba o actualizaba un pago pendiente cuando el admin enviaba monto al asignar tecnico.
- `server/src/modules/appointments/appointments.service.js` creaba o actualizaba un pago pendiente cuando el admin enviaba monto al programar cita.

En base de datos, `pagos.monto` existe y se conserva. Los pagos historicos no se modifican ni se eliminan.

## Regla Nueva

Flujo operativo:

```text
Servicio pendiente
↓
Admin asigna tecnico
↓
Sistema crea o actualiza la cita/asignacion tecnica
↓
No se solicita monto
↓
No se crea pago automatico
↓
El valor queda pendiente para una fase futura
```

Si un cliente viejo envia monto en la asignacion de servicio o programacion de cita, el backend responde `400` con un mensaje claro:

```text
El administrador ya no puede asignar monto desde este flujo.
```

## Backend

Archivos ajustados:

- `server/src/modules/services/services.service.js`
- `server/src/modules/appointments/appointments.service.js`

Cambios principales:

- `PATCH /api/services/:id` acepta asignacion o reasignacion de tecnico sin monto.
- `PATCH /api/services/:id` rechaza payloads con `monto`, `amount`, `serviceAmount`, `montoServicio`, `valorServicio` o `total`.
- `PATCH /api/appointments/:id/schedule` programa fecha y hora sin monto.
- `PATCH /api/appointments/:id/schedule` rechaza payloads economicos.
- Se removio la creacion automatica de pagos desde asignacion de tecnico y programacion de cita.
- Los listados siguen incluyendo informacion de pagos existentes cuando la hay.

## Frontend

Archivos ajustados:

- `src/pages/ServiciosPage.jsx`
- `src/pages/CitasPage.jsx`
- `src/pages/PagosPage.jsx`
- `src/domains/appointments/services/appointmentMappers.js`
- `src/domains/services/services/serviceMappers.js`

Cambios principales:

- Se elimino el input editable de monto en la asignacion de tecnico.
- Se elimino el input editable de monto en la programacion de cita.
- Se removieron validaciones frontend de monto obligatorio.
- El payload de asignacion de tecnico envia solo el tecnico.
- El payload de programacion de cita envia solo fecha/hora normalizada.
- Los pagos historicos muestran el monto como informacion.
- Si no existe pago o monto valido, la interfaz muestra estado pendiente y no ofrece accion de pago.

## Pagos

Los pagos existentes siguen funcionando:

- Se listan.
- Conservan su monto historico.
- Pueden continuar su flujo de pago/verificacion cuando corresponde.

Los servicios nuevos asignados por admin pueden existir sin pago generado. Esto es intencional. El pago se debera crear en una fase posterior cuando exista un flujo formal de cotizacion o definicion de valor.

## Base De Datos

No hubo cambios estructurales.

No se ejecutaron migraciones, `db push`, `DROP`, `TRUNCATE` ni borrados destructivos. La columna `pagos.monto` se conserva para historicos y para el flujo futuro de pagos.

## Pruebas

Script:

```powershell
node server\scripts\test-remove-admin-amount-assignment.js --start-server
```

| ID | Prueba | Resultado final |
|---|---|---|
| AM01 | Admin asigna tecnico sin monto | PASS |
| AM02 | Admin intenta enviar monto | PASS |
| AM03 | Frontend no envia monto | PASS |
| AM04 | Formulario admin sin campo monto | PASS |
| AM05 | Programar cita sin monto | PASS |
| AM06 | Programar cita con monto | PASS |
| AM07 | Servicio sin pago no rompe listado admin | PASS |
| AM08 | Servicio sin pago no rompe listado usuario | PASS |
| AM09 | Usuario no puede pagar si no hay pago | PASS |
| AM10 | Pagos historicos siguen funcionando | PASS |
| AM11 | Tecnico no confirma pago inexistente | PASS |
| AM12 | No regresion de asignacion tecnica | PASS |
| AM13 | No regresion de asesorias | PASS |
| AM14 | No regresion de pagos | PASS |
| AM15 | No regresion general | PASS |

IDs creados durante la ultima ejecucion:

- Usuarios de prueba: admin `54`, usuario `55`, tecnico `56`, asesor `57`.
- Servicios: `48`, `49`, `50`.
- Cita: `36`.
- Pago historico de prueba: `31`.
- Asesoria: `26`.

## Riesgos Y Pendientes

- Falta definir el flujo futuro para establecer el valor del servicio.
- Los servicios sin pago deben seguir mostrandose con estado claro.
- Los reportes financieros deben distinguir servicios sin pago generado.
- Conviene implementar una fase de cotizacion posterior con aprobacion del usuario antes de generar el pago.

