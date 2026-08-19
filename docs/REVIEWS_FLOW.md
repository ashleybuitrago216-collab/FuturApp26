# FuturApp - Flujo del modulo Resenas

## Estado del modulo

El modulo se presenta visualmente como **Resenas**, pero conserva compatibilidad tecnica con el modulo y las rutas `/api/comments`.

No se modifico la base de datos para esta implementacion. Se reutiliza el modelo Prisma existente `Resena`, mapeado a la tabla `resenas`.

## Modelo usado

Modelo Prisma principal:

```prisma
model Resena {
  idResena            Int       @id @default(autoincrement()) @map("id_resena")
  idUsuario           Int?      @map("id_usuario")
  idAsesoria          Int?      @map("id_asesoria")
  idSolicitudServicio Int?      @map("id_solicitud_servicio")
  calificacion        Int?
  comentario          String?   @db.VarChar(500)
  respuestaTecnico    String?   @map("respuesta_tecnico") @db.VarChar(500)
  fechaResena         DateTime? @default(now()) @map("fecha_resena")
  estado              String?   @default("Activa") @db.VarChar(20)

  @@map("resenas")
}
```

## Endpoints

Todos los endpoints requieren JWT.

### GET /api/comments

Lista resenas segun el rol autenticado.

- `admin`: todas las resenas.
- `usuario`: resenas creadas por el usuario.
- `tecnico`: resenas de servicios donde el tecnico esta asignado por cita.
- `asesor`: resenas asociadas directamente a asesorias asignadas al asesor.

### POST /api/comments

Crea una resena de usuario para un servicio.

Reglas:

- Solo rol `usuario`.
- El servicio debe pertenecer al usuario autenticado.
- El servicio debe estar completado/finalizado.
- La calificacion debe estar entre 1 y 5.
- El comentario debe tener entre 5 y 500 caracteres.
- No permite duplicar resena por usuario y servicio si la resena no esta eliminada.

Payload esperado:

```json
{
  "serviceId": 15,
  "rating": 5,
  "comment": "Excelente servicio"
}
```

### PATCH /api/comments/:id/response

Registra o actualiza respuesta de una resena.

Reglas:

- `admin`: puede responder cualquier resena.
- `tecnico`: solo puede responder si esta asignado al servicio de la resena.
- `asesor`: solo puede responder si la resena esta asociada a una asesoria asignada a ese asesor.
- La respuesta debe tener entre 2 y 500 caracteres.

Payload esperado:

```json
{
  "response": "Gracias por tu resena."
}
```

## Vista usuario

El usuario ve dos secciones:

- **Pendientes por resenar**: servicios completados que aun no tienen resena del usuario.
- **Servicios ya resenados**: resenas ya creadas por el usuario.

Los servicios completados se obtienen desde `GET /api/services`; las resenas se obtienen desde `GET /api/comments`. La separacion se calcula en frontend para mantener compatibilidad con los endpoints existentes.

## Vista tecnico

El tecnico ve solo resenas de servicios donde esta asignado por cita:

```text
Resena -> SolicitudServicio -> Cita.idUsuarioTecnico
```

Incluye:

- promedio de estrellas;
- total de resenas;
- pendientes de respuesta;
- respondidas;
- distribucion por calificacion;
- filtros por estado, calificacion, tipo de servicio y orden;
- lista de resenas recibidas;
- respuesta a resenas pendientes si el backend lo autoriza.

## Vista asesor

El asesor solo ve resenas si existe relacion real:

```text
Resena.idAsesoria -> Asesoria.idUsuarioAsesor
```

No se inventan resenas para asesorias. Si no existen resenas asociadas directamente a sus asesorias, la UI muestra un mensaje controlado.

## Vista administrador

El administrador ve:

- promedio global;
- total global;
- pendientes de respuesta;
- respondidas;
- distribucion global de calificaciones;
- filtros avanzados;
- estadisticas por tecnico;
- estadisticas por asesor si existen relaciones reales con asesorias;
- todas las resenas.

El modelo actual no tiene campo real de `reportada`, `moderacion` o equivalente. Por eso la UI muestra:

```text
Reportadas: No disponible en el modelo actual.
```

## Permisos

| Accion | Usuario | Tecnico | Asesor | Admin |
| --- | --- | --- | --- | --- |
| Listar propias | Si | No aplica | No aplica | Si |
| Listar recibidas por tecnico | No | Si | No | Si |
| Listar recibidas por asesor | No | No | Solo relacion real | Si |
| Crear resena | Si, servicio propio completado | No | No | No |
| Responder resena | No | Solo asignada | Solo asesoria asignada | Si |

## Archivos principales

Backend:

- `server/src/modules/comments/comments.service.js`
- `server/src/modules/comments/comments.controller.js`
- `server/src/modules/comments/comments.mapper.js`
- `server/src/modules/comments/comments.routes.js`
- `server/prisma/schema.prisma`

Frontend:

- `src/pages/ComentariosPage.jsx`
- `src/domains/comments/services/commentsApi.js`
- `src/app/router/appRoutes.jsx`

## Validaciones recomendadas

Backend:

```powershell
cd server
npx.cmd prisma validate
npx.cmd prisma generate
```

Frontend:

```powershell
npm.cmd run lint
npm.cmd run build
```

Health check:

```text
GET http://localhost:4000/api/health
```

## Pruebas manuales sugeridas

Usuario:

1. Entrar como usuario con un servicio completado.
2. Abrir Resenas.
3. Confirmar que el servicio aparece en Pendientes por resenar.
4. Publicar resena.
5. Confirmar que pasa a Servicios ya resenados.
6. Confirmar que no aparece de nuevo el boton Escribir resena para ese servicio.

Tecnico:

1. Entrar como tecnico asignado a un servicio con resena.
2. Abrir Resenas.
3. Confirmar estadisticas y distribucion.
4. Filtrar por pendiente/respondida.
5. Responder una resena pendiente.
6. Confirmar que cambia a Respondida.

Asesor:

1. Entrar como asesor.
2. Abrir Resenas.
3. Si no hay resenas con `idAsesoria`, confirmar mensaje controlado.
4. Si existe resena asociada a asesoria asignada, confirmar que aparece y puede responder.

Admin:

1. Entrar como admin.
2. Abrir Resenas.
3. Confirmar promedio global, total, pendientes, respondidas y distribucion.
4. Confirmar estadisticas por tecnico.
5. Confirmar estadisticas por asesor solo si existen relaciones reales.
6. Confirmar nota de reportadas no disponible.

## Limitaciones actuales

- No existe campo real para resenas reportadas o moderacion.
- No existe endpoint dedicado `/api/reviews`; se mantiene `/api/comments` por compatibilidad.
- Las resenas de asesor solo funcionan si los registros tienen `idAsesoria`.
- La fecha real de completado del servicio no existe como campo dedicado en el modelo actual; la UI usa fechas disponibles del servicio.
- No hay soft delete funcional expuesto para resenas.

## Mejoras futuras

- Agregar soporte real de reportes/moderacion con migracion manual controlada.
- Crear alias REST `/api/reviews` manteniendo `/api/comments`.
- Agregar auditoria de cambios de respuestas.
- Agregar fecha real de completado del servicio si negocio lo requiere.
- Agregar pruebas automatizadas de permisos por rol.
