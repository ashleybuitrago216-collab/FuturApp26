# FuturApp - Documentacion Tecnica del Proyecto

## 1. Resumen general

FuturApp es una aplicacion para gestionar servicios tecnicos, citas, pagos, notificaciones y perfiles de usuarios. El slogan actual del proyecto es "Tecnologia que conecta".

El sistema maneja tres roles principales:

- `admin`: administra operaciones, revisa servicios, asigna tecnicos, consulta pagos e informes.
- `asesor`: atiende asesorias programadas, consulta su perfil, notificaciones y comentarios relacionados.
- `tecnico`: atiende servicios asignados, consulta citas y confirma pagos.
- `usuario`: solicita servicios, consulta citas, paga servicios y gestiona su perfil.

El proyecto esta en una fase de migracion progresiva desde datos locales/localStorage hacia una API real con MySQL y Prisma.

### Actualizacion 2026-06-18 - Asesorias sin telefonos en formulario

El modulo Asesorias ya no solicita telefonos en el formulario del usuario. La solicitud conserva descripcion, tipo de dispositivo, fecha y hora de disponibilidad. Los telefonos historicos de `asesorias` se mantienen por compatibilidad, pero el contacto operativo para asesor/admin se obtiene desde `usuarios.telefono`.

La vista del asesor incorpora acciones `Chat` y `Llamar` para asesorias asignadas abiertas. El chat queda preparado sin persistencia ni notificaciones falsas; la llamada usa un enlace `tel:` cuando el perfil del usuario tiene telefono, o muestra un aviso controlado cuando no existe.

Documento especifico: `docs/ADVISORY_CONTACT_AND_PHONE_REMOVAL.md`.

### Actualizacion 2026-06-22 - Tipos tecnicos en asesorias

El modulo Asesorias normaliza la seleccion de tipos de servicio. La asesoria se mantiene como etapa previa de orientacion y no como tipo tecnico ejecutable. El catalogo del asesor excluye nombres equivalentes a `Asesoria`, `Orientacion` o `Consulta`, y el backend rechaza esos IDs aunque se envien manualmente.

Cuando una asesoria resuelta genera un servicio, `solicitudes_servicio.id_tipo_servicio` queda con el tipo tecnico elegido por el asesor. El tecnico visualiza ese tipo en modo lectura y el admin ve el origen `Asesoria #ID` para asignar tecnico y monto sin cambiar el tipo definido.

Documento especifico: `docs/ADVISORY_SERVICE_TYPES_NORMALIZATION.md`.

### Actualizacion 2026-06-22 - Admin sin asignacion de monto

El administrador ya no ingresa ni modifica montos economicos al asignar tecnico o programar citas. La asignacion tecnica funciona sin monto y no crea pagos automaticos incompletos. Si un cliente viejo envia `monto`, `amount`, `serviceAmount`, `montoServicio`, `valorServicio` o `total`, el backend responde `400`.

Los pagos historicos se conservan y siguen visibles como informacion. Los servicios nuevos pueden quedar sin pago generado hasta que exista una fase posterior de cotizacion, aprobacion del usuario y generacion formal del pago.

Documento especifico: `docs/REMOVE_ADMIN_AMOUNT_ASSIGNMENT.md`.

### Actualizacion 2026-06-22 - Cotizacion posterior y pago

El flujo economico queda separado del flujo operativo. El tecnico asignado propone una cotizacion desde el servicio, el usuario la aprueba o rechaza, y solo al aprobar se crea un pago pendiente. El administrador ve el estado de cotizacion y pago, pero no define ni edita montos.

Se agrego el modulo backend `/api/quotes` y la tabla `cotizaciones`. Los pagos historicos se conservan y los servicios sin cotizacion o con cotizacion enviada no tienen pago generado.

Documento especifico: `docs/QUOTES_FLOW.md`.

### Actualizacion 2026-06-23 - Admin no crea servicios

El rol `admin` ya no crea solicitudes de servicio manualmente. La pantalla de servicios oculta el boton `Nuevo servicio` para administradores y el backend rechaza `POST /api/services` con `403` si el usuario autenticado es admin.

El administrador conserva la gestion operativa de servicios existentes: asignar tecnico, programar citas, ver cotizaciones, ver pagos y consultar estados. La creacion manual se conserva para `usuario` y la generacion interna desde asesorias se mantiene mediante `crearServicioDesdeAsesoria(...)`.

Documento especifico: `docs/REMOVE_ADMIN_SERVICE_CREATION.md`.

### Actualizacion 2026-06-23 - Servicio completado por tecnico

El tecnico asignado ahora puede marcar un servicio como `Completado` mediante `PATCH /api/services/:id/complete`. La base conserva el estado `Finalizado` y la API lo expone como `Completado`.

El usuario no puede iniciar el pago aunque exista una cotizacion aprobada y un pago pendiente hasta que el servicio este completado. El pago se sigue creando al aprobar cotizacion, pero `POST /api/payments/:id/initiate` valida que el servicio relacionado este completado antes de procesarlo.

El administrador solo visualiza el estado completado; no puede marcar servicios como completados ni habilitar pagos manualmente.

Documento especifico: `docs/TECHNICIAN_COMPLETE_SERVICE_PAYMENT_GATE.md`.

### Actualizacion 2026-06-23 - Recuperacion de contrasena

La pantalla publica de login incluye el flujo `Olvido su contrasena?`. El usuario solicita recuperacion con su correo y el backend responde siempre un mensaje generico para no revelar si el correo existe.

Se agregaron los endpoints publicos `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`. Los tokens se generan con `crypto.randomBytes`, se almacenan solo como hash SHA-256 en `recuperaciones_contrasena`, expiran en 30 minutos y son de un solo uso. La nueva contrasena se guarda con `bcrypt`.

En desarrollo se devuelve `devResetLink`; en produccion no se expone el enlace. Queda pendiente integrar correo real.

Documento especifico: `docs/PASSWORD_RECOVERY_FLOW.md`.

## 2. Stack tecnologico

### Frontend

| Aspecto | Detalle |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Lenguaje | JavaScript + JSX |
| Estilos | CSS global inyectado desde `src/styles/GlobalStyle.jsx` y estilos inline/componentes propios |
| Puerto | `http://localhost:5173` |
| API base | `VITE_API_URL`, por defecto `http://localhost:4000/api` |
| Auth temporal | JWT guardado en localStorage con clave `futurapp:token` |
| Responsabilidad | Interfaz de usuario, navegacion por tabs, consumo de servicios HTTP y estado local temporal |

### Backend

| Aspecto | Detalle |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| ORM | Prisma |
| Auth | JWT con `jsonwebtoken` |
| Passwords | Hash con `bcryptjs` |
| CORS | `cors` configurado con `CLIENT_URL` |
| Variables | `dotenv` |
| Puerto | `http://localhost:4000` |
| Prefijo API | `/api` |
| Responsabilidad | API REST, validacion de JWT, reglas por rol, acceso a MySQL mediante Prisma |

### Base de datos

| Aspecto | Detalle |
|---|---|
| Motor | MySQL con XAMPP |
| Base esperada | `futurapp` |
| ORM | Prisma Client |
| Schema | `server/prisma/schema.prisma` |
| Migraciones | `server/prisma/migrations/` |
| Seed | `server/prisma/seed.js` |
| Administrador visual | phpMyAdmin |

## 3. Arquitectura general

El flujo general actual es:

```text
Frontend React / Vite
  |
  v
src/infrastructure/http/httpClient.js
  |
  v
Servicios de dominio en src/domains/*/services
  |
  v
API Express bajo /api
  |
  v
Routes -> Controllers -> Services backend
  |
  v
Prisma ORM
  |
  v
MySQL XAMPP / base futurapp
```

El frontend usa `httpClient` para agregar automaticamente el token JWT en el header `Authorization: Bearer <token>`. El backend valida ese token con `verifyToken` y luego aplica reglas por rol en los servicios de dominio.

## 4. Estructura de carpetas

### Frontend

Estructura principal encontrada:

```text
src/
  App.jsx
  main.jsx
  app/
    config/
    layouts/
    providers/
    router/
  components/
    cards/
    modals/
    tables/
    ui/
  data/
    seed.js
  domains/
    appointments/
    auth/
    comments/
    location/
    maps/
    notifications/
    payments/
    profile/
    reports/
    services/
    users/
  infrastructure/
    api/
    database/
    http/
    permissions/
    realtime/
    storage/
  pages/
  shared/
  styles/
  utils/
```

Observaciones:

- `src/pages/` contiene las pantallas principales.
- `src/domains/` organiza rutas, modelos y servicios por dominio.
- `src/infrastructure/http/httpClient.js` centraliza llamadas HTTP a la API.
- `src/infrastructure/storage/localStorageClient.js` todavia persiste estado global local.
- `src/data/seed.js` sigue existiendo como fallback/semilla local para partes no migradas.

### Backend

Estructura principal encontrada:

```text
server/
  package.json
  .env.example
  prisma/
    schema.prisma
    seed.js
    migrations/
  src/
    app.js
    server.js
    config/
      env.js
      prisma.js
    middlewares/
      authMiddleware.js
      errorHandler.js
    routes/
      index.js
    modules/
      appointments/
      auth/
      comments/
      locations/
      notifications/
      payments/
      services/
      users/
```

Observaciones:

- `server/src/app.js` configura Express, CORS, JSON, health check, rutas y errores.
- `server/src/server.js` levanta el servidor HTTP y maneja shutdown por senales.
- `server/src/routes/index.js` monta todos los modulos bajo `/api`.
- Cada modulo backend sigue patron `routes`, `controller`, `service`.

## 5. Frontend actual

El punto de entrada es `src/main.jsx`, que renderiza la aplicacion principal en `src/App.jsx`.

La navegacion no usa React Router tradicional; se maneja con tabs internas definidas en `src/app/router/appRoutes.jsx`. La ruta activa se guarda en estado (`tab`) desde `useAppState`.

El estado global se administra en `src/app/providers/AppStateProvider.jsx`. Actualmente carga:

- datos desde `localStorageClient`;
- sesion persistida en localStorage;
- formularios de login/registro;
- tab activa;
- toast.

El JWT se guarda en `src/domains/auth/services/authTokenStorage.js` con la clave `futurapp:token`.

El consumo de API se centraliza en `src/infrastructure/http/httpClient.js`, que usa `VITE_API_URL` o `http://localhost:4000/api` como fallback.

Dominios encontrados en `src/domains`:

- `appointments`
- `auth`
- `comments`
- `location`
- `maps`
- `notifications`
- `payments`
- `profile`
- `reports`
- `services`
- `users`

Paginas principales encontradas:

- `AuthPage.jsx`
- `DashboardPage.jsx`
- `MiPerfilPage.jsx`
- `UsuariosPage.jsx`
- `ServiciosPage.jsx`
- `CitasPage.jsx`
- `PagosPage.jsx`
- `NotificacionesPage.jsx`
- `ComentariosPage.jsx`
- `InformesPage.jsx`

Tabla de estado frontend:

| Modulo | Estado | Fuente de datos | Observaciones |
|---|---|---|---|
| Auth | Migrado a API | `/api/auth/*` | Login, registro, restauracion de sesion y logout consumen backend. JWT en localStorage. |
| Servicios | Migrado a API | `/api/services` | Pantalla usa `servicesApi` y mappers. |
| Citas | Migrado a API | `/api/appointments` | Pantalla usa `appointmentsApi` y mappers. |
| Pagos | Migrado a API | `/api/payments` | Pantalla usa `paymentsApi`, resumen y acciones por rol. |
| Notificaciones | Migrado a API | `/api/notifications` | Bandeja personal por usuario autenticado; lista, contador y marcado como leida usan backend. Eventos de solicitud, cancelacion, pago realizado y revision de pago notifican a administradores activos con copias separadas. |
| Perfil | Migrado a API | `/api/users/me` | Carga y actualiza perfil propio. Correo y rol son solo lectura en UI. |
| Usuarios Admin | Migrado a API | `/api/users`, `/api/users/catalogs`, `/api/users/:id/admin` | Gestiona roles, areas y estado desde MySQL con protecciones admin. |
| Comentarios | Local/mock | `data.comentarios` en localStorage | Backend tiene listado, pero la UI publica/responde localmente. |
| Informes | Pendiente de revision | Estado local/datos derivados | No se encontro API especifica de informes. |
| Ubicacion tecnicos | Parcial/local | Hook/servicios locales y backend de listado | No hay Socket.IO ni actualizacion real desde frontend. |
| Maps | Pendiente de revision | Servicio local | No se encontro consumo de API real. |
| localStorage global | Parcial | `futurapp:data`, `futurapp:session`, `futurapp:token` | Sigue activo como compatibilidad durante migracion. |

## 6. Backend actual

Express se inicializa en `server/src/app.js`:

- crea `app` con `express()`;
- configura CORS con `env.clientUrl`;
- configura `express.json()`;
- define `GET /api/health`;
- monta rutas con `app.use("/api", routes)`;
- aplica `notFoundHandler` y `errorHandler`.

El servidor se levanta en `server/src/server.js`:

- importa `app`;
- lee `env.port`;
- ejecuta `app.listen(PORT)`;
- maneja error `EADDRINUSE`;
- desconecta Prisma solo en shutdown por `SIGINT` o `SIGTERM`.

Variables de entorno se cargan en `server/src/config/env.js` con `dotenv`.

Prisma se configura en `server/src/config/prisma.js` con `new PrismaClient()`.

JWT se valida en `server/src/middlewares/authMiddleware.js`. La funcion usada por rutas migradas es `verifyToken`, que:

- lee `Authorization: Bearer <token>`;
- valida el token con `JWT_SECRET`;
- consulta el usuario actual con `authService.findMe`;
- asigna `req.user`.

Tabla de modulos backend:

| Modulo | Ruta base | Estado | Responsabilidad |
|---|---|---|---|
| Auth | `/api/auth` | Implementado | Registro, login, me, logout placeholder/local. |
| Users | `/api/users` | Migrado | Lista usuarios reales, perfil propio, catalogos y gestion admin de rol/area/estado. Incluye rol Asesor. |
| Services | `/api/services` | Implementado | CRUD operativo basico, asignacion/cancelacion segun rol. |
| Appointments | `/api/appointments` | Implementado | Listado, programacion y cambio de estado. |
| Payments | `/api/payments` | Implementado | Listado, resumen, iniciar pago y confirmar por tecnico. |
| Notifications | `/api/notifications` | Implementado | Bandeja personal: listado, contador, crear y marcar leidas. Incluye helper reutilizable para notificar administradores activos. |
| Advisories | `/api/advisories` | Fase admin + resolucion | Rol usuario crea/lista solicitudes propias; rol admin lista todas y asigna/reasigna asesor; rol asesor lista asignadas y resuelve asesorias generando servicios reales. Comentarios devuelven estado vacio documentado. |
| Comments | `/api/comments` | Parcial | Solo listado desde Prisma. UI aun local. |
| Locations | `/api/locations` | Parcial | Solo listado desde Prisma. Sin tiempo real. |

## 7. Endpoints actuales

### Auth

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/auth/` | No | Publico | Estado del modulo auth. |
| POST | `/api/auth/register` | No | Publico | Registra usuarios publicos con rol `usuario`. |
| POST | `/api/auth/login` | No | Publico | Valida credenciales y devuelve JWT. |
| GET | `/api/auth/me` | Si | Usuario autenticado | Devuelve usuario autenticado saneado. |
| POST | `/api/auth/logout` | No | Publico | Logout sin invalidacion real del JWT. |

### Services

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/services` | Si | admin, tecnico, usuario | Lista servicios filtrados por rol. |
| POST | `/api/services` | Si | usuario principalmente | Crea solicitud de servicio. |
| PATCH | `/api/services/:id` | Si | admin principalmente | Actualiza servicio; puede asignar tecnico y crear/actualizar cita. |
| PATCH | `/api/services/:id/cancel` | Si | segun reglas del servicio | Cancela servicio. |

### Appointments

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/appointments` | Si | admin, tecnico, usuario | Lista citas filtradas por rol. |
| PATCH | `/api/appointments/:id/schedule` | Si | admin | Programa cita con fecha/hora y notifica al tecnico. |
| PATCH | `/api/appointments/:id/status` | Si | admin, tecnico | Cambia estado de cita. |

### Payments

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/payments` | Si | admin, tecnico, usuario | Lista pagos filtrados por rol. |
| GET | `/api/payments/summary` | Si | admin, tecnico, usuario | Devuelve resumen por rol. |
| GET | `/api/payments/:id` | Si | admin, tecnico, usuario | Devuelve pago si el rol tiene acceso. |
| POST | `/api/payments/:id/initiate` | Si | usuario | Inicia pago de un pago pendiente. |
| POST | `/api/payments/:id/confirm-technician` | Si | tecnico | Confirma pago asociado al tecnico. |

### Notifications

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/notifications` | Si | usuario autenticado | Devuelve solo notificaciones con `id_usuario` igual al usuario del JWT, tambien para admin. |
| GET | `/api/notifications/unread-count` | Si | usuario autenticado | Cuenta solo no leidas propias del usuario autenticado. |
| POST | `/api/notifications` | Si | admin, usuario autenticado | Admin puede crear para otros; usuario solo para si mismo. |
| PATCH | `/api/notifications/read-all` | Si | usuario autenticado | Marca como leidas solo las notificaciones propias. |
| PATCH | `/api/notifications/:id/read` | Si | propietario | Marca una notificacion propia como leida; si pertenece a otro usuario responde 403. |

### Users

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/users` | Si | Admin | Lista usuarios reales saneados desde MySQL. |
| GET | `/api/users/catalogs` | Si | Admin | Devuelve roles y areas de especialidad. |
| PATCH | `/api/users/:id/admin` | Si | Admin | Actualiza rol, area y estado con protecciones de negocio. |
| GET | `/api/users/technicians` | Si | Admin | Lista tecnicos activos reales para asignacion de servicios. |
| GET | `/api/users/me` | Si | Usuario autenticado | Devuelve perfil propio desde MySQL. |
| PATCH | `/api/users/me` | Si | Usuario autenticado | Actualiza perfil propio; rechaza rol, activo e internos. |

### Comments

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/comments` | No en ruta actual | Publico segun codigo actual | Lista comentarios desde Prisma. No hay crear/responder en API. |

### Locations

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/locations` | No en ruta actual | Publico segun codigo actual | Lista ubicaciones de tecnicos desde Prisma. Sin Socket.IO. |

### Advisories

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/advisories` | Si | usuario, asesor | Usuario ve solicitudes propias; asesor ve asesorias asignadas. |
| POST | `/api/advisories` | Si | usuario | Crea solicitud de asesoria pendiente. |
| GET | `/api/advisories/catalogs` | Si | asesor | Devuelve catalogo real de `tipos_servicio` para resolver asesorias. |
| GET | `/api/advisories/:id` | Si | propietario/asignado | Detalle de asesoria propia o asignada. |
| GET | `/api/advisories/:id/comments` | Si | propietario/asignado | Respuesta vacia documentada; relacion funcional pendiente. |
| PATCH | `/api/advisories/:id/assign` | Si | admin | Asigna o reasigna asesor activo si la asesoria no esta resuelta. |
| PATCH | `/api/advisories/:id/resolve` | Si | asesor asignado | Resuelve asesoria pendiente y crea solicitud de servicio real en transaccion. |

### Health

| Metodo | Ruta | Auth requerida | Roles | Descripcion |
|---|---|---|---|---|
| GET | `/api/health` | No | Publico | Verifica API y conexion a base de datos con `SELECT 1`. |

## 8. Base de datos y Prisma

El schema esta en `server/prisma/schema.prisma`.

Configuracion encontrada:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

DATABASE_URL esperada segun `.env.example`:

```text
mysql://root:@localhost:3306/futurapp
```

Modelos existentes:

| Modelo | Proposito | Relaciones principales |
|---|---|---|
| `Role` | Catalogo de roles (`admin`, `tecnico`, `usuario`) | Tiene muchos `User`. |
| `User` | Usuarios del sistema | Relacion con servicios creados/asignados, citas, pagos, notificaciones, comentarios y ubicaciones. |
| `Service` | Solicitudes/servicios tecnicos | Pertenece a usuario; opcionalmente a tecnico; tiene citas y pagos. |
| `Appointment` | Citas asociadas a servicios | Pertenece a usuario, tecnico opcional y servicio opcional unico. |
| `Payment` | Pagos de servicios/citas | Pertenece a usuario; tecnico, servicio y cita opcionales. |
| `Notification` | Alertas por usuario | Pertenece a `User`. |
| `Comment` | Comentarios y respuestas | Pertenece a `User`. |
| `TechnicianLocation` | Ubicacion de tecnicos | Pertenece a `User` tecnico. |

Enums:

- `UserRole`: `admin`, `tecnico`, `usuario`.
- `ServiceStatus`: `Pendiente`, `Completado`, `Cancelado`.
- `PaymentStatus`: `Pendiente`, `Pagado`, `Fallido`, `Reembolsado`.
- `AppointmentStatus`: `Pendiente`, `Programada`, `Completada`, `Cancelada`.

Campos sensibles:

- `User.passwordHash` no debe devolverse al frontend.
- JWT se firma con `JWT_SECRET`.

Migraciones existentes:

| Migracion | Proposito |
|---|---|
| `20260602203226_init` | Creacion inicial de tablas/modelos. |
| `20260602211700_unique_appointment_service` | Agrega unicidad para `Appointment.serviceId`. |
| `20260602214815_add_profile_fields` | Agrega campos de perfil: documento y direccion. |

Seed actual (`server/prisma/seed.js`):

| Usuario demo | Rol | Password |
|---|---|---|
| `admin@futurapp.com` | `admin` | `123456` |
| `tecnico@futurapp.com` | `tecnico` | `123456` |
| `usuario@futurapp.com` | `usuario` | `123456` |

El seed tambien crea servicios demo, citas, pagos, notificaciones, un comentario y una ubicacion de tecnico.

## 9. Variables de entorno

### Frontend

Segun `.env.example` en la raiz:

| Variable | Uso | Ejemplo | Obligatoria |
|---|---|---|---|
| `VITE_API_URL` | URL base del backend consumida por `httpClient` | `http://localhost:4000/api` | Recomendado; hay fallback en codigo |

### Backend

Segun `server/.env.example` y `server/src/config/env.js`:

| Variable | Uso | Ejemplo | Obligatoria |
|---|---|---|---|
| `DATABASE_URL` | Conexion MySQL para Prisma | `mysql://root:@localhost:3306/futurapp` | Si |
| `JWT_SECRET` | Firma y validacion de JWT | `change_this_secret` | Si en produccion; fallback en desarrollo |
| `PORT` | Puerto del backend | `4000` | No; fallback `4000` |
| `CLIENT_URL` | Origen permitido por CORS | `http://localhost:5173` | No; fallback `http://localhost:5173` |

No se revisan ni publican secretos reales del archivo `.env`.

## 10. Flujo de autenticacion

1. El usuario inicia sesion desde la UI de auth.
   - Archivo: `src/App.jsx`
   - Servicio: `src/domains/auth/services/authApi.js`

2. El frontend llama:
   - `POST /api/auth/login`

3. El backend valida credenciales.
   - Ruta: `server/src/modules/auth/auth.routes.js`
   - Controller: `server/src/modules/auth/auth.controller.js`
   - Service: `server/src/modules/auth/auth.service.js`
   - Password: `bcrypt.compare(...)`

4. El backend genera JWT.
   - Archivo: `server/src/modules/auth/auth.service.js`
   - Usa `jsonwebtoken` y `env.jwtSecret`.

5. El frontend guarda el token temporalmente.
   - Archivo: `src/domains/auth/services/authTokenStorage.js`
   - Clave: `futurapp:token`

6. El frontend envia el token en requests protegidos.
   - Archivo: `src/infrastructure/http/httpClient.js`
   - Header: `Authorization: Bearer <token>`

7. El backend valida token con middleware.
   - Archivo: `server/src/middlewares/authMiddleware.js`
   - Funcion principal usada: `verifyToken`.

8. El backend autoriza segun rol en servicios de dominio.
   - Ejemplos: `services.service.js`, `appointments.service.js`, `payments.service.js`, `notifications.service.js`, `users.service.js`.

## 11. Flujo principal del sistema

Flujo funcional actual:

```text
Usuario crea servicio
  |
  v
Admin revisa servicio
  |
  v
Admin asigna tecnico
  |
  v
Backend crea o actualiza cita asociada
  |
  v
Admin programa cita
  |
  v
Tecnico ve cita asignada
  |
  v
Pago se inicia por usuario o se confirma por tecnico
  |
  v
Notificaciones se registran o marcan
```

Estado de implementacion:

- Creacion/listado/cancelacion de servicios esta migrada a API.
- Asignacion de tecnico y creacion/actualizacion de cita se maneja desde backend.
- Programacion y estados de citas estan migrados.
- Pagos estan migrados con resumen, inicio y confirmacion.
- Notificaciones estan migradas para listado, contador, creacion y lectura.
- Perfil propio esta migrado.
- Comentarios, usuarios admin completos y ubicacion en tiempo real siguen pendientes/parciales.

## 12. Comandos para ejecutar el proyecto

### Backend

```bash
cd server
npm install
npm run dev
```

Scripts reales encontrados en `server/package.json`:

```bash
npm run dev
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run seed
```

Equivalentes Prisma:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### Frontend

```bash
npm install
npm run dev
```

Scripts reales encontrados en `package.json`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## 13. Como probar conexion con la base de datos

1. Abrir XAMPP.
2. Iniciar MySQL.
3. Verificar que exista la base `futurapp` en phpMyAdmin.
4. Verificar `server/.env` o usar `server/.env.example` como referencia:

```text
DATABASE_URL="mysql://root:@localhost:3306/futurapp"
```

5. Validar Prisma:

```bash
cd server
npx prisma validate
npx prisma generate
```

6. Levantar backend:

```bash
npm run dev
```

7. Probar health check:

```text
GET http://localhost:4000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "app": "FuturApp API",
  "database": "connected"
}
```

Nota importante:

```text
http://localhost:4000/
```

puede responder `Route not found`. Eso no significa que el backend este danado. La ruta correcta para probar la API es:

```text
http://localhost:4000/api/health
```

## 14. Estado de migracion actual

| Area | Estado | Comentario |
|---|---|---|
| Auth | Migrado a API | Login, registro, me y token JWT funcionando. |
| Servicios | Migrado a API | Frontend consume `/api/services`. |
| Citas | Migrado a API | Frontend consume `/api/appointments`. |
| Pagos | Migrado a API | Frontend consume `/api/payments` y resumen. |
| Notificaciones | Migrado a API | Frontend consume `/api/notifications` y contador no leidas. La seguridad de visibilidad esta en backend por `id_usuario = req.user.id`; admin no ve bandejas ajenas. |
| Perfil | Migrado a API | Frontend consume `/api/users/me`; email solo lectura. |
| Usuarios Admin | Migrado a API | UI de administracion usa MySQL como fuente de verdad. |
| Asesorias | Fase admin + resolucion | Usuario crea solicitudes; admin asigna/reasigna asesor; asesor resuelve asignadas; al resolver se crea un servicio real Pendiente relacionado por `asesorias.id_solicitud_servicio`. |
| Comentarios | Parcial/local | Backend lista comentarios, pero UI crea/responde local. |
| Ubicacion tecnicos | Parcial | Backend lista ubicaciones; frontend tiene hooks/servicios locales. |
| Socket.IO | Pendiente | No encontrado implementado. |
| Pasarela real | Pendiente | Pagos son simulados/preparados, no proveedor real. |
| Retiro total de localStorage | Pendiente | Persistencia global local sigue activa. |

## 15. Riesgos tecnicos actuales

- JWT guardado en localStorage: expuesto a riesgo si hay XSS.
- Mezcla temporal entre API real y datos locales: puede generar inconsistencias visuales.
- `GET /api/comments` y `GET /api/locations` no tienen `verifyToken` en sus rutas actuales.
- Gestion completa de usuarios admin sigue local; podria divergir de MySQL.
- Comentarios todavia se publican/responden localmente en UI.
- Ubicacion de tecnicos no usa Socket.IO ni actualizacion real desde frontend.
- Pagos no tienen pasarela real ni webhooks.
- Dependencia local de XAMPP y phpMyAdmin para entorno de desarrollo.
- Diferencias futuras entre XAMPP local y produccion pueden requerir ajustes de CORS, DATABASE_URL, SSL y despliegue.
- `server/package.json#prisma` usa configuracion que Prisma advierte como deprecada hacia Prisma 7.

## 16. Recomendaciones para continuar

Orden recomendado:

1. Mantener esta documentacion como referencia del estado real.
2. Proteger rutas publicas sensibles existentes: `/api/comments`, `/api/locations`.
3. Continuar migrando modulos locales restantes a API.
4. Migrar Comentarios a API para publicar y responder desde MySQL.
5. Migrar Ubicacion tecnicos a API completa.
6. Retirar `localStorage` global progresivamente, modulo por modulo.
7. Implementar Socket.IO para notificaciones/ubicacion en tiempo real.
8. Preparar despliegue: variables por entorno, CORS, logs y migraciones.
9. Integrar pasarela real de pagos y webhooks.
10. Mejorar seguridad: refresh tokens/cookies httpOnly o estrategia equivalente.

## 17. Checklist para nuevos cambios

Antes de modificar el proyecto:

- Confirmar modulo objetivo.
- Revisar dependencias del modulo.
- Revisar si el modulo ya esta migrado a API.
- No romper Auth.
- No romper Servicios.
- No romper Citas.
- No romper Pagos.
- No romper Notificaciones.
- No romper Perfil.
- Validar backend.
- Validar frontend.
- Ejecutar lint.
- Ejecutar build.
- Documentar archivos modificados.
- Documentar endpoints nuevos o modificados.
- Documentar riesgos y pendientes.

## 18. Conclusion

FuturApp ya tiene una base full stack funcional: frontend React/Vite, backend Node/Express, Prisma ORM y MySQL con XAMPP. Los modulos criticos de Auth, Servicios, Citas, Pagos, Notificaciones y Perfil ya consumen API real.

### Resolucion De Asesorias

La fase de gestion y resolucion de asesorias agrega:

- `GET /api/advisories/catalogs`: catalogo real de tipos de servicio para asesor y asesores activos/carga para admin.
- `PATCH /api/advisories/:id/assign`: asignacion o reasignacion por admin.
- `PATCH /api/advisories/:id/resolve`: solo asesor asignado.
- Relacion persistente `asesorias.id_solicitud_servicio -> solicitudes_servicio.id_solicitud_servicio`.
- Creacion transaccional de una solicitud de servicio real.
- Estado canonico almacenado: `Asesoria resuelta`.
- Prevencion de duplicados por validacion y constraint unico.
- Notificaciones al usuario, administradores activos y asesor.

El servicio generado queda:

```text
estado = Pendiente
prioridad = Media
tecnico = NULL
cita = NULL
pago = NULL
```

Documentacion completa:

```text
docs/ADVISORY_RESOLUTION_AND_SERVICE_CREATION.md
docs/ADVISORY_ADMIN_ASSIGNMENT_PHASE.md
```

El proyecto todavia conserva una capa local en Comentarios y algunas areas de ubicacion/reportes. Usuarios Admin ya usa backend con JWT, MySQL y reglas de rol/area/estado.

### Gestion Real De Usuarios Admin

La seccion `UsuariosPage.jsx` usa MySQL como fuente de verdad y ya no lee `data.users`, seed ni localStorage para administrar usuarios. Endpoints:

- `GET /api/users`: lista usuarios reales, solo admin.
- `GET /api/users/catalogs`: roles y areas de especialidad, solo admin.
- `PATCH /api/users/:id/admin`: actualiza rol, area y estado, solo admin.
- `GET /api/users/technicians`: lista tecnicos activos reales para servicios.

Reglas backend:

- Un tecnico requiere `id_area_especialidad` valida.
- Al cambiar de tecnico a otro rol se limpia `id_area_especialidad`.
- No se permite degradar o desactivar accidentalmente al admin autenticado.
- No se permite degradar o desactivar al ultimo administrador activo.
- No se permite degradar o desactivar tecnicos con citas activas asignadas.
- `contrasena_hash` nunca se expone en respuestas.

## 19. Estado Final Sincronizado De Base De Datos

Fecha de sincronizacion final: 2026-06-09.

Base oficial:

```text
futurapp
```

Dump portable actualizado:

```text
database/backups/futurapp_final_funcional_actualizado.sql
```

Backup previo a la sincronizacion final:

```text
database/backups/futurapp_before_final_sync_20260609_205549.sql
```

La base oficial fue auditada contra `server/prisma/schema.prisma`; Prisma valida correctamente y el cliente fue generado. No existen tablas `legacy_*` ni `empleados` en la base oficial.

### Pagos Y Verificacion Tecnica

El flujo actual es:

```text
Usuario crea solicitud
Admin asigna tecnico y monto COP
Backend crea/actualiza cita
Backend crea/actualiza pago pendiente
Usuario realiza pago simulado
Pago queda Pagado
Tecnico confirma metodo recibido
Admin revisa coincidencias o inconsistencias
```

`pagos.id_medio_pago` conserva el metodo declarado por el usuario. La tabla `verificaciones_pago` conserva la auditoria tecnica:

- metodo declarado por tecnico;
- cantidad de intentos;
- coincidencia de metodos;
- revision administrativa requerida;
- observacion administrativa;
- fecha de confirmacion.

Politica de dos intentos:

- Primer desacuerdo: `409 PAYMENT_METHOD_MISMATCH`.
- Segundo desacuerdo: confirma con observacion y `requiresAdminReview: true`.
- Coincidencia: confirma normalmente.

La comision se calcula en backend:

```text
Plataforma: 25%
Tecnico: 75%
```

No se guarda comision ni ganancia como columnas separadas.

### Catalogos Confirmados

Roles demo:

- `Administrador`
- `Tecnico`
- `Usuario`

Medios de pago disponibles:

- `Tarjeta de Crédito`
- `Transferencia Bancaria`
- `Pago en Efectivo`
- `PayPal`
- `Criptomonedas`
- `Nequi`
- `DaviPlata`
- `Bancolombia`
- `Tarjeta`

Usuarios demo:

| Rol | Correo | Contrasena |
|---|---|---|
| Admin | `admin@futurapp.com` | `123456` |
| Tecnico | `tecnico@futurapp.com` | `123456` |
| Usuario | `usuario@futurapp.com` | `123456` |

### Importacion En Otro Equipo

Usar la guia:

```text
docs/IMPORTAR_BASE_DATOS.md
```

No ejecutar:

```text
npx prisma migrate dev
npx prisma migrate reset
npx prisma db push
```

El dump final fue probado importandolo en la base temporal `futurapp_prueba_importacion_final`; la prueba confirmo 24 tablas, 36 foreign keys, usuarios demo, catalogos, pagos y `verificaciones_pago`.
