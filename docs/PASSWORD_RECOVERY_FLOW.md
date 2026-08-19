# Recuperacion De Contrasena

Fecha: 2026-06-23
Actualizacion fase 2: envio real por SMTP configurable.

## Objetivo

Permitir que un usuario recupere el acceso desde la pantalla de login sin revelar si el correo existe en la base.

## Flujo

```text
Usuario pulsa "Olvido su contrasena?"
Ingresa correo
Backend responde mensaje generico
Si el correo existe, genera token seguro
Guarda solo el hash del token
Construye enlace con CLIENT_URL
Si MAIL_ENABLED=true, envia el enlace por correo SMTP
Si MAIL_ENABLED=false, mantiene modo desarrollo
Usuario abre /reset-password?token=...
Ingresa nueva contrasena y confirmacion
Backend valida token, expiracion y fortaleza
Actualiza usuarios.contrasena_hash con bcrypt
Marca el token como usado
Usuario inicia sesion con la nueva contrasena
```

## Tabla Nueva

Tabla: `recuperaciones_contrasena`

Creada por SQL manual:

```text
database/migrations/manual/012_recuperacion_contrasena.sql
```

Campos:

| Campo | Funcion |
|---|---|
| `id_recuperacion` | Identificador del token |
| `id_usuario` | Usuario propietario |
| `token_hash` | Hash SHA-256 del token, nunca el token plano |
| `fecha_expiracion` | Vencimiento del enlace |
| `usado` | Marca de token consumido |
| `fecha_uso` | Fecha en que fue usado |
| `fecha_creacion` | Fecha de emision |

Relaciones:

- `recuperaciones_contrasena.id_usuario` -> `usuarios.id_usuario`.

Indices:

- `idx_recuperaciones_usuario`.
- `idx_recuperaciones_token_hash`.

## Seguridad Del Token

El token plano se genera con:

```js
crypto.randomBytes(32).toString("hex")
```

La base guarda solo:

```js
crypto.createHash("sha256").update(token).digest("hex")
```

Duracion actual:

```text
30 minutos
```

Cada token es de un solo uso. Al emitir uno nuevo para el mismo usuario, los tokens activos anteriores se marcan como usados.

## Endpoints

### Solicitar Recuperacion

```http
POST /api/auth/forgot-password
```

Payload:

```json
{
  "email": "usuario@correo.com"
}
```

Respuesta siempre generica:

```json
{
  "message": "Si el correo esta registrado, enviaremos instrucciones para recuperar la contrasena."
}
```

En desarrollo sin SMTP real (`MAIL_ENABLED=false`), si el correo existe, tambien se devuelve:

```json
{
  "devResetLink": "http://localhost:5173/reset-password?token=..."
}
```

No se devuelve `devResetLink` cuando `MAIL_ENABLED=true`. En produccion tampoco se devuelve `devResetLink`.

Con `MAIL_ENABLED=true`, si el correo existe y el SMTP esta configurado, el backend intenta enviar el enlace real por correo.

### Restablecer Contrasena

```http
POST /api/auth/reset-password
```

Payload:

```json
{
  "token": "...",
  "password": "NuevaClave123",
  "confirmPassword": "NuevaClave123"
}
```

Validaciones:

- Token requerido.
- Token existente.
- Token no usado.
- Token no vencido.
- Usuario activo.
- Contrasena minima de 8 caracteres.
- Al menos una letra y un numero.
- Confirmacion igual a la contrasena.

Respuesta:

```json
{
  "message": "Contrasena actualizada correctamente. Ya puedes iniciar sesion."
}
```

## Frontend

Archivos:

- `src/pages/AuthPage.jsx`
- `src/App.jsx`
- `src/domains/auth/services/authApi.js`

Rutas publicas:

- `/forgot-password`
- `/reset-password?token=...`

Estas rutas no requieren JWT, no aparecen en el menu y se renderizan dentro de la pantalla publica de autenticacion.

## Modo Desarrollo

Si `MAIL_ENABLED=false`, el backend mantiene el modo de desarrollo:

- imprime el enlace en consola;
- devuelve `devResetLink` solo si `NODE_ENV !== "production"` y `MAIL_ENABLED=false`.

Ejemplo recomendado para desarrollo local:

```env
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MAIL_ENABLED=false
```

## Envio Real Por SMTP

El envio real usa Nodemailer con SMTP configurable por variables de entorno. No hay credenciales hardcodeadas.

Variables disponibles en `server/.env.example`:

```env
MAIL_ENABLED=false
MAIL_HOST=
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM_NAME=FuturApp
MAIL_FROM_ADDRESS=no-reply@futurapp.com
```

Funcion de cada variable:

| Variable | Funcion |
|---|---|
| `MAIL_ENABLED` | Activa o desactiva el envio real de correo. |
| `MAIL_HOST` | Servidor SMTP, por ejemplo Mailtrap, Gmail, Brevo o SMTP empresarial. |
| `MAIL_PORT` | Puerto SMTP. Usualmente `587`, `465` o el puerto del proveedor. |
| `MAIL_SECURE` | `true` para TLS directo, normalmente puerto `465`; `false` para STARTTLS, normalmente `587`. |
| `MAIL_USER` | Usuario SMTP. |
| `MAIL_PASS` | Contrasena, token o app password SMTP. |
| `MAIL_FROM_NAME` | Nombre visible del remitente. |
| `MAIL_FROM_ADDRESS` | Direccion de correo remitente. |

Tambien se usan:

```env
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

`CLIENT_URL` define el origen del enlace:

```text
http://localhost:5173/reset-password?token=TOKEN_REAL
```

En produccion debe apuntar al dominio publico del frontend. Si `NODE_ENV=production`, el backend nunca devuelve `devResetLink`. Si `MAIL_ENABLED=true`, tampoco se devuelve `devResetLink` aunque `NODE_ENV=development`.

### Ejemplo Mailtrap

```env
MAIL_ENABLED=true
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=usuario_mailtrap
MAIL_PASS=password_mailtrap
MAIL_FROM_NAME=FuturApp
MAIL_FROM_ADDRESS=no-reply@futurapp.com
```

### Ejemplo Gmail SMTP

```env
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu_correo@gmail.com
MAIL_PASS=app_password_de_google
MAIL_FROM_NAME=FuturApp
MAIL_FROM_ADDRESS=tu_correo@gmail.com
```

Gmail requiere contrasena de aplicacion, no la contrasena normal de la cuenta.

## Configuracion De Correo Real Con Gmail SMTP

Para probar recuperacion real con Gmail, las credenciales deben vivir solo en `server/.env`. No deben copiarse en archivos `.js`, `.jsx`, `.json`, documentacion ni commits.

Configuracion esperada con placeholders:

```env
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=TU_CORREO_GMAIL@gmail.com
MAIL_PASS=TU_APP_PASSWORD_DE_16_CARACTERES
MAIL_FROM_NAME=FuturApp
MAIL_FROM_ADDRESS=TU_CORREO_GMAIL@gmail.com
```

Funcion de las variables:

| Variable | Funcion |
|---|---|
| `NODE_ENV` | Define el entorno. En `production` nunca se devuelve `devResetLink`. |
| `CLIENT_URL` | URL del frontend usada para construir `/reset-password?token=...`. |
| `MAIL_ENABLED` | Activa el envio real cuando vale `true`; con `false` vuelve al modo desarrollo. |
| `MAIL_HOST` | Servidor SMTP de Gmail: `smtp.gmail.com`. |
| `MAIL_PORT` | Puerto SMTP. Para Gmail con STARTTLS usa `587`. |
| `MAIL_SECURE` | Para puerto `587` debe ser `false`; para TLS directo en `465` seria `true`. |
| `MAIL_USER` | Correo Gmail que autentica contra SMTP. |
| `MAIL_PASS` | Contrasena de aplicacion de Gmail, no la contrasena normal. |
| `MAIL_FROM_NAME` | Nombre visible del remitente. |
| `MAIL_FROM_ADDRESS` | Correo remitente; normalmente el mismo que `MAIL_USER`. |

Pasos seguros en Gmail:

1. Usar una cuenta Gmail valida.
2. Activar verificacion en dos pasos.
3. Crear una contrasena de aplicacion.
4. Pegar esa contrasena de aplicacion en `MAIL_PASS`.
5. No usar la contrasena normal de Gmail.
6. Confirmar que `server/.env` no se sube al repositorio.

Comandos seguros para preparar backend:

```bash
cd server
npx prisma validate
npx prisma generate
npm run dev
```

`cd server` entra al backend. `npx prisma validate` valida el schema Prisma. `npx prisma generate` regenera el cliente Prisma. `npm run dev` levanta la API.

Health check esperado:

```text
GET http://localhost:4000/api/health
```

```json
{
  "status": "ok",
  "app": "FuturApp API",
  "database": "connected"
}
```

Prueba desde endpoint:

```http
POST http://localhost:4000/api/auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "CORREO_REAL_REGISTRADO_EN_FUTURAPP"
}
```

Respuesta esperada:

```json
{
  "message": "Si el correo esta registrado, enviaremos instrucciones para recuperar la contrasena."
}
```

En `NODE_ENV=development` puede aparecer `devResetLink`; el objetivo de esta prueba es verificar que tambien llegue el correo real. En `NODE_ENV=production` no debe aparecer `devResetLink`.

Prueba desde frontend:

1. Ejecutar `npm run dev` en la raiz para levantar React/Vite.
2. Entrar al login.
3. Pulsar "Olvido su contrasena?".
4. Ingresar un correo registrado.
5. Revisar inbox y spam.
6. Abrir el enlace recibido.
7. Definir nueva contrasena y confirmarla.
8. Iniciar sesion con la nueva contrasena.
9. Confirmar que la contrasena anterior ya no funciona.

Si el correo llega a spam:

- marcarlo como no spam;
- revisar `MAIL_FROM_ADDRESS`;
- usar una cuenta/remitente consistente;
- para produccion, configurar un dominio propio con SPF, DKIM y DMARC.

Si Gmail bloquea el intento:

- confirmar que la verificacion en dos pasos esta activa;
- generar una nueva contrasena de aplicacion;
- verificar que `MAIL_USER` y `MAIL_FROM_ADDRESS` coincidan;
- revisar alertas de seguridad de Google;
- no intentar usar la contrasena normal de Gmail.

Para volver a modo desarrollo:

```env
MAIL_ENABLED=false
```

Con ese valor, el backend vuelve a imprimir el enlace en consola y solo devuelve `devResetLink` fuera de produccion.

### Ejemplo SMTP Generico

```env
MAIL_ENABLED=true
MAIL_HOST=smtp.tu-proveedor.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=usuario_smtp
MAIL_PASS=secreto_smtp
MAIL_FROM_NAME=FuturApp
MAIL_FROM_ADDRESS=soporte@tu-dominio.com
```

## Manejo De Errores SMTP

Si falla el envio:

- el usuario recibe el mismo mensaje generico;
- no se revela si el correo existe;
- no se imprimen credenciales;
- no se imprime el token ni el enlace en produccion;
- se registra un error tecnico seguro en consola.

## Backups Y Dumps

Backup previo:

```text
database/backups/futurapp_before_password_recovery_20260623_111648.sql
```

Dump posterior:

```text
database/backups/futurapp_after_password_recovery_20260623_112324.sql
```

## Pruebas

Script:

```text
server/scripts/test-password-recovery-flow.js
```

Comando:

```powershell
node server\scripts\test-password-recovery-flow.js --start-server
```

Resultados:

| ID | Caso | Resultado |
|---|---|---|
| PR01 | Solicitar recuperacion con correo existente | PASS |
| PR02 | Solicitar recuperacion con correo inexistente | PASS |
| PR03 | Token valido cambia contrasena | PASS |
| PR04 | Login con contrasena nueva | PASS |
| PR05 | Login con contrasena anterior falla | PASS |
| PR06 | Token usado no se reutiliza | PASS |
| PR07 | Token vencido no funciona | PASS |
| PR08 | Token invalido no funciona | PASS |
| PR09 | Contrasenas no coinciden | PASS |
| PR10 | Contrasena debil | PASS |
| PR11 | No regresion login normal | PASS |
| PR12 | No regresion de roles | PASS |
| PR13 | No se guarda token plano | PASS |
| PR14 | No se devuelve `devResetLink` en produccion simulado | PASS |
| PR15 | `MAIL_ENABLED=false` conserva `devResetLink` en desarrollo | PASS |
| PR16 | `NODE_ENV=production` nunca devuelve `devResetLink` | PASS |
| PR17 | Correo inexistente sigue con respuesta generica | PASS |
| PR18 | Servicio de correo no guarda token plano | PASS |
| PR19 | Fallo SMTP no revela informacion sensible | PASS |
| PR20 | Configuracion SMTP se lee desde variables de entorno | PASS |
| PR21 | `MAIL_ENABLED=true` oculta `devResetLink` en desarrollo | PASS |

IDs creados por la prueba:

- Los IDs pueden variar por ejecucion.
- El script reutiliza/actualiza usuarios de prueba con prefijo `PRUEBA_PR`.
- El script crea recuperaciones temporales para validar token valido, token usado y token vencido.

## Riesgos Y Pendientes

- Falta rate limiting para evitar abuso.
- No se revocan sesiones JWT ya emitidas.
- La expiracion esta fija en codigo y podria moverse a variable de entorno.
- Falta auditoria formal de solicitudes de recuperacion.
- Falta monitoreo/alertas de fallos SMTP.
