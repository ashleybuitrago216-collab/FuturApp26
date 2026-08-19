# Quitar Creacion De Servicios Desde Admin

## Regla De Negocio

El rol `admin` ya no crea solicitudes de servicio manualmente.

El administrador conserva:

- Ver servicios existentes.
- Consultar detalle.
- Asignar o reasignar tecnico.
- Programar citas.
- Ver tipo de servicio.
- Ver estado de cotizacion.
- Ver estado de pago.
- Gestionar servicios creados por usuarios o generados desde asesorias.

El administrador no puede:

- Ver el boton `Nuevo servicio`.
- Abrir el formulario de creacion.
- Enviar un payload de creacion desde frontend.
- Crear un servicio por `POST /api/services`.

## Diagnostico

Antes del ajuste:

- `src/pages/ServiciosPage.jsx` renderizaba `Nuevo servicio` para cualquier rol que no fuera tecnico.
- El modal `form` servia para crear y editar servicios.
- `save()` llamaba `servicesApi.createService()` cuando no existia `editId`.
- `server/src/modules/services/services.service.js` permitia crear servicios a `usuario` y `admin`.

El flujo de asesorias no usa `POST /api/services`. La resolucion de asesoria llama la funcion interna `crearServicioDesdeAsesoria(...)`, por eso se mantuvo intacta.

## Cambios Frontend

Archivo modificado:

- `src/pages/ServiciosPage.jsx`

Cambios:

- El boton `Nuevo servicio` depende de `canCreateService`, que solo es verdadero para rol `usuario`.
- El guard de `save()` impide que un rol no usuario envie creacion aunque el estado local quede en modo creacion.
- El admin mantiene las acciones de edicion/gestion sobre servicios existentes.

## Cambios Backend

Archivo modificado:

- `server/src/modules/services/services.service.js`

Cambios:

- `POST /api/services` rechaza rol `admin` con `403`.
- El mensaje es:

```text
El administrador no puede crear servicios. Solo puede gestionar servicios existentes.
```

- Rol `usuario` conserva la creacion manual.
- Roles `tecnico` y `asesor` siguen recibiendo `403`.
- `crearServicioDesdeAsesoria(...)` se conserva para el flujo interno de asesorias.

## Base De Datos

No hubo cambios de base de datos.

No se modificaron tablas, no se crearon migraciones y no se tocaron servicios historicos.

## Pruebas

Script:

```powershell
node server\scripts\test-remove-admin-service-creation.js --start-server
```

Resultado:

| ID | Prueba | Resultado |
|---|---|---|
| ASC01 | Admin no ve boton Nuevo servicio | PASS |
| ASC02 | Admin no puede abrir formulario de creacion | PASS |
| ASC03 | Admin no envia payload de creacion desde frontend | PASS |
| ASC04 | Admin no crea servicio por API | PASS |
| ASC05 | Admin conserva gestion | PASS |
| ASC06 | Usuario puede crear servicio si aplica | PASS |
| ASC07 | Tecnico no puede crear servicio | PASS |
| ASC08 | Asesor no crea servicio manual por POST | PASS |
| ASC09 | Asesoria genera servicio correctamente | PASS |
| ASC10 | Cotizaciones no se rompen | PASS |
| ASC11 | Pagos no se rompen | PASS |
| ASC12 | No regresion general | PASS |

Ultima ejecucion:

- Usuarios: admin `63`, usuario `64`, tecnico `65`, asesor `66`.
- Servicios: `80`, `81`.
- Asesoria: `29`.
- Cotizacion: `25`.
- Pago: `41`.
- Cita: `64`.

## Riesgos Y Pendientes

- Si se agrega una ruta futura como `/admin/services/new`, debe heredar esta misma regla.
- Si se agregan formularios separados por rol, el backend sigue siendo la fuente de verdad y debe mantenerse el `403` para admin.

