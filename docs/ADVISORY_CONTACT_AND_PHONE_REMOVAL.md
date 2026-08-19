# Ajuste Asesorias: Formulario Sin Telefonos Y Contacto Del Asesor

Fecha: 2026-06-18

## Objetivo

Esta fase ajusta el modulo de asesorias sin reconstruirlo:

- El usuario ya no registra telefonos al solicitar asesoria.
- `POST /api/advisories` acepta solicitudes sin telefonos.
- Los telefonos historicos de `asesorias` se conservan por compatibilidad.
- El asesor puede iniciar acciones de contacto desde su vista: `Chat` y `Llamar`.
- La llamada usa el telefono registrado en el perfil del usuario (`usuarios.telefono`), no campos de la asesoria.

## Diagnostico

Archivos revisados:

- `src/pages/UsuarioAsesoriaPage.jsx`
- `src/pages/AsesoriasPage.jsx`
- `src/pages/AsesorDashboardPage.jsx`
- `src/pages/AdminAsesoriasPage.jsx`
- `src/domains/advisories/services/advisoriesApi.js`
- `src/domains/advisories/services/advisoryMappers.js`
- `server/src/modules/advisories/advisories.routes.js`
- `server/src/modules/advisories/advisories.controller.js`
- `server/src/modules/advisories/advisories.service.js`
- `server/src/modules/advisories/advisories.mapper.js`
- `server/src/modules/services/services.service.js`
- `server/src/modules/notifications/notifications.service.js`
- `server/src/modules/users/users.service.js`
- `server/src/modules/auth/auth.service.js`
- `server/prisma/schema.prisma`

Hallazgo principal:

- La base de datos ya permite `NULL` en `asesorias.telefono_principal` y `asesorias.telefono_alterno`.
- Prisma ya modela esos campos como opcionales (`String?`).
- El bloqueo estaba en backend: `advisories.service.js` llamaba `normalizePhone(payload.telefonoPrincipal, { required: true })`.
- El frontend seguia mostrando, validando, prellenando y enviando `telefonoPrincipal` y `telefonoAlterno`.

## Base De Datos

No fue necesaria migracion.

Estado confirmado:

- `asesorias.telefono_principal`: `varchar(15) NULL`.
- `asesorias.telefono_alterno`: `varchar(15) NULL`.
- `usuarios.telefono`: `varchar(15) NULL`.

Decision:

- No eliminar columnas de `asesorias`.
- Mantener datos historicos.
- Mantener compatibilidad con clientes antiguos que todavia envien telefonos.
- Usar `usuarios.telefono` como fuente de contacto para asesor/admin.

## Backend

Archivo ajustado:

- `server/src/modules/advisories/advisories.service.js`

Cambio:

- `telefonoPrincipal` dejo de ser obligatorio.
- `telefonoAlterno` sigue siendo opcional.
- Si un cliente antiguo envia telefonos, el backend los valida y normaliza.
- Si no llegan telefonos, se guardan como `NULL`.

Reglas actuales de creacion:

- descripcion inicial obligatoria.
- tipo de dispositivo obligatorio.
- fecha de contacto obligatoria.
- hora de contacto obligatoria.
- telefono principal no obligatorio.
- telefono alterno no obligatorio.

## Frontend Usuario

Archivo ajustado:

- `src/pages/UsuarioAsesoriaPage.jsx`

Campos visibles actuales:

- Descripcion inicial.
- Tipo de dispositivo.
- Fecha.
- Hora.

Campos removidos del formulario:

- Telefono principal.
- Telefono alterno.

Tambien se removio:

- estado local de telefonos;
- validacion frontend de telefonos;
- prellenado desde perfil;
- envio de telefonos en el payload;
- visualizacion de telefonos propios de la asesoria en el detalle del usuario.

Payload actual:

```json
{
  "descripcionInicial": "El computador se apaga despues de unos minutos.",
  "tipoDispositivo": "Computador",
  "fechaContacto": "2026-06-20",
  "horaContacto": "14:30"
}
```

## Frontend Asesor

Archivo ajustado:

- `src/pages/AsesoriasPage.jsx`

Acciones nuevas para asesorias abiertas:

- `Chat`
- `Llamar`

### Chat

Primera version preparada, sin persistencia:

- Abre un modal con datos de la asesoria.
- Muestra que el canal esta preparado para futura integracion.
- No guarda mensajes.
- No crea notificaciones falsas.
- No crea endpoints nuevos.

### Llamar

Reglas:

- Usa `solicitante.telefono`, proveniente de `usuarios.telefono`.
- Si existe telefono, muestra enlace `tel:<numero>`.
- Si no existe telefono, muestra aviso controlado:

```text
El usuario no tiene un numero registrado en su perfil.
```

No se integro telefonia externa, WhatsApp ni WebSocket.

## Frontend Admin

Archivo ajustado:

- `src/pages/AdminAsesoriasPage.jsx`

Cambio:

- La vista administrativa deja de mostrar `telefonoPrincipal`/`telefonoAlterno` de la asesoria como fuente principal.
- Ahora muestra `Telefono de perfil` desde `solicitante.telefono`.
- Si no existe, muestra el mismo aviso controlado.

## Seguridad

La seguridad sigue en backend:

- Usuario puede crear y ver sus asesorias.
- Asesor solo ve y resuelve asesorias asignadas.
- Admin ve y asigna asesorias.
- Tecnico no participa en asesorias.
- Un asesor ajeno recibe `403` al consultar una asesoria que no le pertenece.

El chat preparado no expone informacion adicional porque usa la misma vista role-aware del asesor.

## Pruebas

Script creado:

```bash
node server/scripts/test-advisory-contact-and-phone-removal.js --start-server
```

Casos cubiertos:

- AC01 formulario sin telefonos.
- AC02 crear asesoria sin telefono.
- AC03 backend no exige telefono.
- AC04 compatibilidad con cliente viejo.
- AC05 usuario ve sus asesorias.
- AC06 admin asigna asesor.
- AC07 asesor ve asesoria asignada.
- AC08 boton Chat visible.
- AC09 asesor ajeno no accede.
- AC10 boton Llamar visible.
- AC11 llamada sin telefono en perfil.
- AC12 llamada con telefono en perfil.
- AC13 resolver asesoria sigue funcionando.
- AC14 usuario no puede completar asesoria.
- AC15 tecnico no puede completar asesoria.
- AC16 admin ve servicio generado.
- AC17 no regresion basica.

## Riesgos Y Pendientes

- Chat real persistido.
- Auditoria de contactos.
- Integracion WebSocket.
- Integracion WhatsApp.
- Registro historico de llamadas.
- Validacion de telefono en perfil del usuario.
- Mensajes de asesoria con tabla dedicada.

## Siguiente Fase Recomendada

Crear comunicacion persistida de asesorias con una tabla dedicada `mensajes_asesoria` y endpoints:

```text
GET  /api/advisories/:id/messages
POST /api/advisories/:id/messages
```

Permisos recomendados:

- solicitante;
- asesor asignado;
- admin en modo lectura.
