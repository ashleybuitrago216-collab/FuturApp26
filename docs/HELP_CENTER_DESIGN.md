# FuturApp - Diseno del modulo Ayuda contextual y Base de conocimiento

## Fase 1 - Diagnostico y diseno

Esta fase documenta el diseno tecnico antes de modificar base de datos o implementar el modulo completo. No se aplicaron migraciones, no se crearon tablas y no se agregaron endpoints definitivos.

## 1. Diagnostico de arquitectura actual

FuturApp usa una arquitectura modular:

- Frontend: React + Vite.
- Backend: Express con rutas bajo `/api`.
- ORM: Prisma.
- Autenticacion: JWT con `verifyToken`.
- Roles reales: `admin`, `tecnico`, `usuario`, `asesor`.

Frontend relevante:

- `src/app/router/appRoutes.jsx` centraliza navegacion visible por rol.
- `src/app/layouts/AppShell.jsx` renderiza menu lateral segun `getVisibleRoutes(session)`.
- `src/app/config/roles.js` contiene helpers de permisos basicos.
- Las pantallas se organizan en `src/pages/` y dominios en `src/domains/`.

Backend relevante:

- `server/src/app.js` monta `/api`.
- `server/src/routes/index.js` registra modulos por dominio.
- Los modulos siguen patron `*.routes.js`, `*.controller.js`, `*.service.js`, `*.mapper.js`.
- `server/src/middlewares/authMiddleware.js` expone `verifyToken`.

Base de datos:

- Ya existe el modelo Prisma `Ayuda`, mapeado a la tabla `ayudas`.
- El modelo actual tiene campos basicos: titulo, categoria, descripcion, archivoUrl, fechaPublicacion y estado.
- El modelo actual no tiene control por rol, slug, tipo de contenido, ayuda contextual, enlaces relacionados, orden, autor, actualizacion ni flags de administracion.

## 2. Objetivo funcional

Crear un centro de ayuda que permita consultar informacion por rol y contexto:

- preguntas frecuentes;
- guias de navegacion;
- procedimientos paso a paso;
- recursos multimedia cuando existan;
- buscador;
- categorias;
- enlaces relacionados;
- ayuda contextual desde pantallas y procesos;
- administracion de contenido por usuarios autorizados.

## 3. Reglas de permisos propuestas

Lectura:

- `admin`: puede ver contenido de `admin` y contenido comun.
- `tecnico`: puede ver contenido de `tecnico` y contenido comun.
- `usuario`: puede ver contenido de `usuario` y contenido comun.
- `asesor`: puede ver contenido de `asesor` y contenido comun.

Administracion:

- Solo `admin` puede crear, editar, publicar, archivar y ordenar articulos.
- No se recomienda permitir administracion a tecnico, usuario ni asesor en fases iniciales.
- Si luego se habilita un rol editor, debe agregarse como permiso explicito, no como rol nuevo.

Contenido comun:

- Se recomienda representar contenido general con `publico` o `todos` en la matriz de roles permitidos.
- El backend debe filtrar siempre por rol autenticado; el frontend no debe ser la unica barrera.

## 4. Modelo de datos recomendado

No se modifica base de datos en esta fase. Para una fase posterior, el modelo recomendado es evolucionar la tabla `ayudas` o crear tablas complementarias.

Opcion recomendada: evolucionar `ayudas` y agregar tablas relacionales.

### Tabla `ayudas`

Campos sugeridos:

- `id_ayuda`
- `slug`
- `titulo`
- `resumen`
- `contenido`
- `categoria`
- `tipo_contenido`: `faq`, `guia`, `tutorial`, `procedimiento`, `contextual`
- `pantalla_contexto`: ejemplo `servicios`, `pagos`, `reportes`
- `accion_contexto`: ejemplo `crear_servicio`, `aprobar_cotizacion`, `descargar_reporte`
- `archivo_url`
- `video_url`
- `estado`: `borrador`, `publicado`, `archivado`
- `orden`
- `fecha_publicacion`
- `fecha_actualizacion`
- `id_usuario_autor`

### Tabla `ayudas_roles`

Campos sugeridos:

- `id_ayuda_rol`
- `id_ayuda`
- `rol`: `admin`, `tecnico`, `usuario`, `asesor`, `todos`

### Tabla `ayudas_relacionadas`

Campos sugeridos:

- `id_ayuda_relacionada`
- `id_ayuda`
- `id_ayuda_destino`

### Indices sugeridos

- `ayudas.slug` unico.
- `ayudas.estado`.
- `ayudas.categoria`.
- `ayudas.pantalla_contexto`, `ayudas.accion_contexto`.
- `ayudas_roles.rol`.

## 5. Endpoints recomendados

Todos los endpoints deben usar `verifyToken`.

Lectura:

- `GET /api/help`
  - Lista articulos visibles para el rol autenticado.
  - Query params: `q`, `category`, `type`, `screen`, `action`.

- `GET /api/help/categories`
  - Lista categorias disponibles para el rol autenticado.

- `GET /api/help/context`
  - Devuelve ayuda contextual por pantalla y accion.
  - Query params: `screen`, `action`.

- `GET /api/help/:slug`
  - Devuelve detalle del articulo si el rol tiene permiso.
  - Incluye enlaces relacionados permitidos para el rol.

Administracion:

- `POST /api/help`
  - Solo admin.

- `PATCH /api/help/:id`
  - Solo admin.

- `PATCH /api/help/:id/publish`
  - Solo admin.

- `PATCH /api/help/:id/archive`
  - Solo admin.

- `DELETE /api/help/:id`
  - No recomendado al inicio. Preferir archivado.

## 6. Estructura backend propuesta

Crear modulo:

```text
server/src/modules/help/
  help.routes.js
  help.controller.js
  help.service.js
  help.mapper.js
  help.permissions.js
```

Registrar en:

```text
server/src/routes/index.js
```

Permisos:

- `help.permissions.js` debe centralizar:
  - `canReadHelpArticle(authUser, article)`
  - `canManageHelp(authUser)`
  - `getAllowedHelpRoles(authUser)`

Servicio:

- Debe filtrar por rol en Prisma.
- Debe validar estado publicado para usuarios no admin.
- Debe impedir que contenido admin aparezca a usuario, tecnico o asesor.
- Debe retornar payloads saneados, sin datos internos innecesarios.

## 7. Estructura frontend propuesta

Crear dominio:

```text
src/domains/help/
  routes/HelpRoute.jsx
  services/helpApi.js
  components/HelpSearch.jsx
  components/HelpCategoryList.jsx
  components/HelpArticleList.jsx
  components/HelpArticleDetail.jsx
  components/ContextualHelpButton.jsx
```

Crear pagina si se mantiene patron actual:

```text
src/pages/AyudaPage.jsx
```

Agregar ruta:

```js
{ id: "ayuda", label: "Ayuda", icon: "help", roles: ["admin", "tecnico", "usuario", "asesor"], Component: HelpRoute }
```

El icono puede agregarse a `src/components/ui/Icon.jsx` si no existe.

## 8. Ayuda contextual

La ayuda contextual debe funcionar por identificadores estables:

- `screen`: modulo o pantalla.
- `action`: proceso o accion.

Ejemplos:

- `screen=servicios`, `action=crear_solicitud`
- `screen=cotizaciones`, `action=aprobar_cotizacion`
- `screen=pagos`, `action=confirmar_pago`
- `screen=reportes`, `action=descargar_reporte`
- `screen=asesorias`, `action=chat_asesoria`
- `screen=locations`, `action=ver_mapa`

Frontend:

- Un componente `ContextualHelpButton` puede recibir `screen` y `action`.
- Al hacer clic, consulta `GET /api/help/context?screen=...&action=...`.
- Puede abrir modal lateral o panel compacto con articulos relacionados.

Backend:

- Debe aplicar el mismo filtro por rol.
- Si no hay articulo exacto, puede devolver articulos de la categoria de la pantalla.

## 9. Contenido inicial sugerido por rol

Usuario:

- Solicitar servicio.
- Registrar ubicacion del servicio.
- Usar chat de asesoria.
- Aprobar o rechazar cotizacion.
- Realizar pago.
- Escribir resena.
- Descargar reporte personal.

Tecnico:

- Revisar servicios asignados.
- Compartir ubicacion.
- Proponer cotizacion.
- Marcar servicio como completado.
- Confirmar datos de pago.
- Responder resenas.
- Descargar reporte tecnico.

Admin:

- Gestionar usuarios.
- Asignar tecnico.
- Supervisar servicios, citas, pagos y cotizaciones.
- Revisar reportes administrativos.
- Administrar contenidos de ayuda.

Asesor:

- Revisar asesorias asignadas.
- Usar chat de asesoria.
- Resolver asesorias.
- Generar servicio desde asesoria, si aplica.

Comun:

- Iniciar sesion.
- Recuperar contrasena.
- Actualizar perfil.
- Consultar notificaciones.

## 10. Plan de implementacion por fases

Fase 1:

- Diagnostico y diseno tecnico.
- Documento `docs/HELP_CENTER_DESIGN.md`.
- Sin cambios de base de datos.
- Sin endpoints definitivos.

Fase 2:

- Implementar version frontend estatica con contenido local por rol.
- Agregar ruta `Ayuda`.
- Agregar buscador y categorias.
- Sin base de datos.

Fase 3:

- Crear SQL manual para evolucionar modelo de ayuda.
- Crear backup antes del SQL.
- Actualizar Prisma.
- Ejecutar `npx prisma validate` y `npx prisma generate`.

Fase 4:

- Implementar backend `/api/help`.
- Filtrado por rol en servidor.
- Endpoints de lectura y detalle.

Fase 5:

- Implementar administracion de contenidos solo para admin.
- Estados borrador/publicado/archivado.
- Validaciones y mappers.

Fase 6:

- Integrar ayuda contextual en pantallas clave.
- Servicios, pagos, cotizaciones, asesorias, reportes y geolocalizacion.

Fase 7:

- Pruebas de permisos, busqueda, detalle, contenido relacionado y administracion.
- Documentacion final.

## 11. Riesgos detectados

- El modelo `Ayuda` existente no permite control real por rol.
- Si el frontend filtra contenido sin respaldo backend, podria exponerse contenido no autorizado.
- La administracion de ayuda requiere distinguir borradores de contenido publicado.
- Los articulos relacionados deben filtrar tambien por rol para evitar filtraciones indirectas.
- Agregar multimedia debe evitar subir archivos arbitrarios sin validacion.
- Si se reutiliza `archivoUrl`, debe validarse que no apunte a recursos sensibles.

## 12. Criterios de aceptacion para pasar a Fase 2

- Diseno revisado y aprobado.
- Sin cambios de base de datos.
- Sin migraciones.
- Roles y permisos definidos.
- Modelo de datos recomendado documentado.
- Endpoints propuestos documentados.
- Estrategia de frontend y ayuda contextual documentada.
- Plan por fases claro.

## 13. Fase 2 - Centro de ayuda frontend estatico

Implementacion frontend sin base de datos y sin endpoints:

- Ruta `Ayuda` agregada en `src/app/router/appRoutes.jsx`.
- Disponible para `admin`, `tecnico`, `usuario` y `asesor`.
- Pagina principal en `src/pages/AyudaPage.jsx`.
- Ruta de dominio en `src/domains/help/routes/HelpRoute.jsx`.
- Contenido local en `src/domains/help/data/helpContent.js`.
- Componente preparado para ayuda contextual en `src/domains/help/components/ContextualHelpButton.jsx`.
- Icono `help` agregado al sistema de iconos existente.

Comportamiento implementado:

- Filtrado local por rol autenticado.
- Buscador por titulo, resumen, categoria, tipo, pantalla, accion y pasos.
- Filtro por categoria.
- Detalle de articulo.
- Pasos numerados.
- Enlaces relacionados filtrados al contenido visible para el rol.
- Articulos comunes para todos los roles.
- Articulos especificos para usuario, tecnico, admin y asesor.

Limitaciones de esta fase:

- El contenido es estatico y vive en frontend.
- No existe administracion real de contenidos todavia.
- No hay persistencia en tabla `ayudas`.
- En Fase 2 no habia endpoints `/api/help`; fueron agregados posteriormente en Fase 3.
- El filtrado por rol en esta fase es frontend; la version con backend debe repetir el filtro en servidor antes de entregar contenido.

Notas de seguridad:

- No se incluyen secretos, tokens, credenciales ni datos personales.
- No se expone contenido administrativo a otros roles en el dataset visible.
- La administracion de contenidos para admin se muestra como articulo preparatorio, no como CRUD funcional.

## 14. Fase 3 - Backend, base de datos y API

Implementacion backend con migracion manual segura:

- Backup previo creado en `database/backups/`.
- Migracion SQL manual creada en `database/migrations/manual/015_help_center_backend.sql`.
- Tabla `ayudas` evolucionada sin borrar datos existentes.
- Tablas nuevas:
  - `ayudas_roles`;
  - `ayudas_relacionadas`.
- Prisma actualizado con:
  - `Ayuda`;
  - `AyudaRol`;
  - `AyudaRelacionada`.
- Modulo backend creado en `server/src/modules/help/`.
- Ruta registrada en `server/src/routes/index.js` bajo `/api/help`.
- Seed inicial creado en `server/scripts/seed-help-content.js`.

Endpoints disponibles:

- `GET /api/help`
- `GET /api/help/categories`
- `GET /api/help/context?screen=...&action=...`
- `GET /api/help/:slug`
- `POST /api/help` solo admin
- `PATCH /api/help/:id` solo admin
- `PATCH /api/help/:id/publish` solo admin
- `PATCH /api/help/:id/archive` solo admin

Reglas implementadas:

- Todos los endpoints usan `verifyToken`.
- Usuario, tecnico y asesor solo consultan articulos publicados/activos.
- La lectura filtra por rol en backend usando `ayudas_roles`.
- La busqueda respeta rol y estado.
- La ayuda contextual respeta rol y estado.
- Los articulos relacionados se filtran tambien contra articulos visibles para el rol.
- Solo admin puede crear, editar, publicar o archivar.
- El contenido recibido por endpoints de administracion elimina etiquetas HTML basicas antes de persistir.

Limitaciones de esta fase:

- En Fase 3 el frontend aun usaba contenido estatico; la conexion a `/api/help` se implemento en Fase 4.
- No se implemento carga de archivos ni subida multimedia.
- No se implemento editor visual de administracion.
- `slug` se indexa, pero no se marco unico para evitar bloquear datos historicos con posibles duplicados; el servicio crea y busca por `findFirst`.

## 15. Fase 4 - Conexion frontend con `/api/help`

Implementacion de integracion API:

- Servicio frontend creado en `src/domains/help/services/helpApi.js`.
- Mapper frontend creado en `src/domains/help/services/helpMappers.js`.
- `src/pages/AyudaPage.jsx` ahora carga articulos desde `GET /api/help`.
- La pantalla carga categorias desde `GET /api/help/categories`.
- Al seleccionar un articulo, carga detalle desde `GET /api/help/:slug`.
- `ContextualHelpButton` consulta `GET /api/help/context?screen=...&action=...`.
- El contenido estatico de Fase 2 se mantiene como fallback si la API falla o no devuelve articulos.

Reglas conservadas:

- El backend sigue filtrando por JWT, rol y estado.
- El frontend no muestra JSON ni datos internos del modelo.
- No se agregaron endpoints nuevos en esta fase.
- No se tocaron base de datos ni migraciones en esta fase.

Limitaciones:

- La administracion visual de contenidos sigue pendiente.
- El fallback estatico existe solo para resiliencia; la fuente principal pasa a ser `/api/help`.

## 16. Fase 4.1 - Cierre, QA por rol y documentacion final

Revision realizada:

- `AyudaPage.jsx` conserva `/api/help` como fuente principal.
- `ContextualHelpButton` consulta `/api/help/context`.
- El fallback estatico sigue disponible si la API falla.
- La ruta `Ayuda` permanece disponible para `admin`, `tecnico`, `usuario` y `asesor`.
- No se agregaron endpoints nuevos.
- No se tocaron base de datos ni migraciones en esta fase de cierre.

Pruebas funcionales por rol:

| Rol | Articulos | Categorias | Detalle | Resultado |
| --- | ---: | ---: | --- | --- |
| admin | 11 | 9 | OK | Puede consultar contenido comun y administrativo |
| tecnico | 11 | 9 | OK | Puede consultar contenido comun y tecnico |
| usuario | 10 | 9 | OK | Puede consultar contenido comun y de usuario |
| asesor | 7 | 4 | OK | Puede consultar contenido comun y de asesor |

Pruebas de seguridad:

- Usuario intentando abrir articulo admin: bloqueado.
- Usuario intentando crear articulo: bloqueado.
- Solicitud sin token a `/api/help`: bloqueada.
- Ayuda contextual de usuario para `servicios/create_service`: OK.
- Ayuda contextual de asesor para `asesorias/advisory_chat`: OK.

Validaciones esperadas para cierre:

- `npm run lint`.
- `npm run build`.
- `cd server && npx prisma validate`.
- Health check `/api/health` con database connected.

Limitaciones finales:

- La administracion visual de contenidos queda pendiente para una fase posterior.
- No hay editor enriquecido ni carga de archivos.
- El frontend aun conserva fallback estatico para tolerancia a fallos, aunque la fuente principal ya es backend.

## 17. Fase 5 - Administracion visual de contenidos

Implementacion frontend:

- La pantalla `Ayuda` agrega modo **Gestion de contenidos** solo para `admin`.
- El modo admin usa `GET /api/help?includeAll=true` para listar tambien borradores y archivados.
- Se agregaron acciones visuales para:
  - crear articulo;
  - editar articulo;
  - publicar articulo;
  - archivar articulo;
  - asignar roles visibles;
  - definir categoria, tipo, pantalla y accion contextual.
- Los roles disponibles en el formulario son `todos`, `admin`, `tecnico`, `usuario` y `asesor`.
- El formulario usa los endpoints existentes:
  - `POST /api/help`;
  - `PATCH /api/help/:id`;
  - `PATCH /api/help/:id/publish`;
  - `PATCH /api/help/:id/archive`.

Reglas conservadas:

- Usuario, tecnico y asesor no ven el panel de administracion.
- El backend sigue bloqueando escritura para roles no admin.
- No se agregaron tablas, migraciones ni endpoints nuevos.
- Al editar un articulo se carga primero el detalle desde `/api/help/:slug` para evitar sobrescribir contenido completo con datos resumidos de la tarjeta.

Pruebas de cierre:

- Admin real de prueba (`role=admin`) carga `GET /api/help?includeAll=true`: 25 articulos.
- Admin carga detalle del primer articulo: OK.
- Usuario sigue bloqueado al abrir articulo admin.
- Usuario sigue bloqueado al intentar crear articulo.
- Health check mantiene database connected.

Limitaciones:

- No hay editor enriquecido WYSIWYG.
- No hay carga de archivos ni multimedia desde la UI.
- La administracion de articulos relacionados queda pendiente para una mejora posterior.

## 18. Fase 5.1 - Cierre, QA final y documentacion de administracion visual

Revision realizada:

- Se verifico que el panel **Gestion de contenidos** solo se renderiza para `admin`.
- Se verifico que la pantalla de consulta sigue disponible para `admin`, `tecnico`, `usuario` y `asesor`.
- Se verifico que el frontend usa los endpoints ya existentes, sin crear rutas nuevas.
- Se verifico que la vista admin usa `GET /api/help?includeAll=true`.
- Se verifico que roles no admin no pueden escribir aunque llamen directamente al endpoint.

Pruebas finales:

| Caso | Resultado |
| --- | --- |
| Admin real carga `GET /api/help?includeAll=true` | 25 articulos |
| Admin carga detalle de articulo | OK |
| Admin actualiza articulo con datos equivalentes | OK |
| Admin publica articulo de forma idempotente | OK |
| Usuario intenta abrir articulo no permitido | Bloqueado con 403 |
| Usuario intenta crear articulo | Bloqueado con 403 |

Notas de QA:

- Para evitar contaminar la base con articulos de prueba, la validacion de guardado se hizo con una actualizacion idempotente sobre un articulo existente.
- La cuenta historica `admin@futurapp.com` aparece con rol `tecnico` en esta base local; para QA se uso una cuenta de prueba con rol canonico `admin`.
- El backend continua siendo la barrera de seguridad real para escritura y lectura por rol.

Validaciones finales:

- `npm run lint`.
- `npm run build`.
- `cd server && npx prisma validate`.
- Health check `/api/health` con database connected.

Limitaciones pendientes:

- No hay carga de archivos ni multimedia.
- No hay editor WYSIWYG.
- La gestion visual de articulos relacionados queda pendiente.
- No existe borrado fisico desde UI; se mantiene el criterio de archivado.
