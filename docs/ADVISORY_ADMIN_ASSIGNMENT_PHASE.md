# Gestion Administrativa De Asesorias

Fecha: 2026-06-18

## Objetivo

Cerrar la brecha operativa entre la solicitud de asesoria creada por el usuario y el trabajo del asesor.

Antes de esta fase, el usuario podia crear asesorias y el asesor podia resolverlas si ya estaban asignadas, pero no existia una pantalla administrativa completa para asignar asesor.

## Alcance Implementado

Backend:

- `GET /api/advisories` ahora permite rol `admin` y devuelve todas las asesorias.
- `GET /api/advisories/:id` ahora permite rol `admin`.
- `GET /api/advisories/catalogs` ahora permite `admin` y `asesor`.
- `PATCH /api/advisories/:id/assign` permite asignar o reasignar asesor.

Frontend:

- Nueva pantalla `src/pages/AdminAsesoriasPage.jsx`.
- Nueva ruta admin `asesorias-admin`.
- Filtros por busqueda, estado y asesor.
- Selector de asesores activos con carga actual.
- Modal de detalle.
- Modal de asignacion/reasignacion.

Pruebas:

- Nuevo script `server/scripts/test-advisory-admin-assignment-flow.js`.
- Casos AA01-AA12 ejecutados contra API real y MySQL.

## Reglas Backend

Endpoint:

```text
PATCH /api/advisories/:id/assign
```

Payload:

```json
{
  "asesorId": 41
}
```

Validaciones:

- JWT obligatorio.
- Solo rol `admin`.
- La asesoria debe existir.
- La asesoria no puede estar resuelta.
- La asesoria no puede tener servicio generado.
- La asesoria no puede estar cancelada.
- El asesor debe existir.
- El asesor debe estar activo.
- El asesor debe tener rol canonico `asesor`.

Acciones:

- Actualiza `id_usuario_asesor`.
- Cambia estado a `Asignada`.
- Actualiza `fecha_actualizacion`.
- Notifica al usuario solicitante.
- Notifica al asesor si cambio la asignacion.
- No crea servicio.
- No crea cita.
- No crea pago.

## Catalogo De Asesores

`GET /api/advisories/catalogs` devuelve para admin:

- `tiposServicio`
- `asesores`

Cada asesor incluye:

- `id`
- `idUsuario`
- `nombre`
- `apellido`
- `name`
- `correo`
- `telefono`
- `carga`

La carga actual cuenta asesorias activas asignadas, sin servicio generado, en estados:

- `Pendiente`
- `Asignada`
- `En proceso`

## Ajuste De Resolucion

El endpoint de resolucion ahora acepta asesorias en estados:

- `Pendiente`
- `Asignada`
- `En proceso`

Esto permite que una asesoria asignada por admin pueda ser terminada por el asesor.

## Frontend Admin

Archivo:

```text
src/pages/AdminAsesoriasPage.jsx
```

La vista muestra:

- ID de asesoria.
- Fecha y hora de contacto.
- Usuario solicitante.
- Estado.
- Asesor asignado.
- Carga del asesor.
- Servicio generado.
- Acciones de detalle/asignacion.

La accion `Asignar` o `Reasignar` solo aparece si:

- la asesoria no esta resuelta;
- la asesoria no tiene servicio generado;
- la asesoria no esta cancelada.

## Pruebas Ejecutadas

Comando:

```bash
node server/scripts/test-advisory-admin-assignment-flow.js --start-server
```

Resultado:

| ID | Prueba | Resultado |
| -- | ------ | --------- |
| AA01 | Admin lista todas las asesorias | PASS |
| AA02 | Listados role-aware se mantienen | PASS |
| AA03 | Admin obtiene asesores activos con carga | PASS |
| AA04 | Admin asigna asesor | PASS |
| AA05 | Asesor y usuario ven asignacion | PASS |
| AA06 | Notificaciones de asignacion | PASS |
| AA07 | Admin reasigna asesoria no resuelta | PASS |
| AA08 | Roles incorrectos no asignan | PASS |
| AA09 | Asesor invalido o inactivo | PASS |
| AA10 | No reasigna asesoria resuelta | PASS |
| AA11 | Asesor puede resolver estado Asignada | PASS |
| AA12 | No regresion basica | PASS |

## Datos De Prueba

Usuarios:

- Admin: `38`
- Usuario: `39`
- Tecnico: `40`
- Asesor: `41`
- Asesor B: `42`
- Asesor inactivo: `43`

Asesorias:

- `13`: asignada, reasignada y resuelta desde estado `Asignada`.
- `14`: resuelta, usada para validar que no se puede reasignar.

## Validaciones Tecnicas

- `node --check server/src/modules/advisories/advisories.service.js`: PASS.
- `node --check server/src/modules/advisories/advisories.controller.js`: PASS.
- `node --check server/scripts/test-advisory-admin-assignment-flow.js`: PASS.
- `npx prisma validate`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

## Pendientes

- Validacion de conflictos de horario por asesor.
- Vista de metricas de asesorias.
- Canal de mensajes usuario-asesor.
- Ampliar `solicitudes_servicio.descripcion_problema` a `TEXT` en una fase separada.
