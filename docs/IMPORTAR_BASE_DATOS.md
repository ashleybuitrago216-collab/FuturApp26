# Importar Base De Datos FuturApp

SQL final actualizado:

- `database/backups/futurapp_final_roles_normalizados.sql`

Este dump fue generado desde la base oficial `futurapp` despues de normalizar roles. Contiene la tabla `verificaciones_pago` y solo los roles oficiales `Administrador`, `Tecnico` y `Usuario`.

## Requisitos

1. Instalar XAMPP.
2. Encender MySQL.
3. Confirmar puerto:

```powershell
Test-NetConnection localhost -Port 3306
```

4. Confirmar que existe el cliente:

```powershell
C:\xampp\mysql\bin\mysql.exe --version
```

## Importacion En Otro Equipo

Crear la base destino y luego importar desde la raiz del proyecto:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 --execute="CREATE DATABASE IF NOT EXISTS futurapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 futurapp --execute="SOURCE C:/ruta/al/proyecto/database/backups/futurapp_final_roles_normalizados.sql"
```

El dump no incluye `CREATE DATABASE` ni `USE`, para permitir importarlo tambien en bases temporales de prueba. La base oficial esperada sigue siendo:

```text
futurapp
```

No contiene:

- `legacy_*`
- `empleados`
- `futurapp_phase3b_prueba`
- roles historicos `Cliente`, `Soporte` ni `Visitante`

## Nota Sobre Montos Administrativos

La base conserva la tabla `pagos` y la columna `monto` para pagos historicos. La version actual del backend no permite que el administrador cree o modifique montos desde asignacion de tecnico o programacion de cita. Por eso, despues de importar, pueden existir servicios sin pago generado; esto es valido y queda preparado para un flujo futuro de cotizacion.

## Nota Sobre Cotizaciones

La version actual requiere la tabla `cotizaciones`. Si se importa un dump anterior, aplicar despues el SQL manual:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 futurapp --execute="SOURCE C:/ruta/al/proyecto/database/migrations/manual/011_cotizaciones_servicio.sql"
```

No ejecutar migraciones Prisma para esta restauracion.

## Nota Sobre Recuperacion De Contrasena

La version actual requiere la tabla `recuperaciones_contrasena`. Si se importa un dump anterior, aplicar despues el SQL manual:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 futurapp --execute="SOURCE C:/ruta/al/proyecto/database/migrations/manual/012_recuperacion_contrasena.sql"
```

Esta tabla guarda hashes de tokens de recuperacion, no tokens planos. En desarrollo el backend puede devolver `devResetLink`; en produccion no se debe exponer.

## Nota Sobre Servicio Completado Y Pago

La version actual usa el estado existente `Finalizado` de la tabla `estados` para persistir servicios completados. La API lo presenta como `Completado`.

No se requiere SQL adicional para esta fase. El pago pendiente puede existir desde la aprobacion de cotizacion, pero el backend solo permite iniciarlo cuando el tecnico asignado complete el servicio.

## Configurar Backend

Crear o revisar `server/.env`:

```env
DATABASE_URL="mysql://root:@localhost:3306/futurapp"
JWT_SECRET="change_this_secret"
PORT=4000
CLIENT_URL="http://localhost:5173"
```

Si Vite usa otro puerto, ajustar `CLIENT_URL`.

## Instalar Dependencias

Raiz:

```powershell
npm install
```

Backend:

```powershell
cd server
npm install
npx.cmd prisma validate
npx.cmd prisma generate
```

No ejecutar migraciones Prisma para esta restauracion.

## Levantar

Backend:

```powershell
cd server
npm.cmd run dev
```

Frontend:

```powershell
npm.cmd run dev
```

Health esperado:

```json
{
  "status": "ok",
  "app": "FuturApp API",
  "database": "connected"
}
```

## Usuarios Demo

| Rol | Correo | Contrasena |
|---|---|---|
| Admin | `admin@futurapp.com` | `123456` |
| Tecnico | `tecnico@futurapp.com` | `123456` |
| Usuario | `usuario@futurapp.com` | `123456` |
| Asesor | `asesor@futurapp.com` | `123456` |

Las contrasenas estan guardadas con bcrypt.

## Nota Sobre Asesorias

Desde el ajuste del 2026-06-18, el formulario de solicitud de asesoria no pide telefonos. Las columnas `asesorias.telefono_principal` y `asesorias.telefono_alterno` siguen existiendo y pueden quedar `NULL`; esto es esperado. El asesor y el administrador usan `usuarios.telefono` como dato de contacto cuando exista en el perfil.

No ejecutar migraciones Prisma para este ajuste. No hubo cambio estructural de base de datos.

## Nota Sobre Tipos De Servicio Y Asesorias

La asesoria no debe importarse ni usarse como tipo tecnico final. Si existe un registro `Asesoria` en `tipos_servicio`, el backend lo conserva para compatibilidad historica, pero:

- no aparece en el selector del asesor;
- no se acepta en `PATCH /api/advisories/:id/resolve`;
- no debe usarse para asignar tecnicos.

Los servicios generados desde asesoria guardan el `id_tipo_servicio` tecnico elegido por el asesor y el admin solo debe asignar tecnico y monto.

## Flujo De Validacion

1. Usuario crea solicitud.
2. Admin asigna tecnico y monto COP.
3. Backend crea cita y pago pendiente.
4. Usuario paga con `DaviPlata`.
5. Tecnico confirma metodo.
6. Primer desacuerdo devuelve `409 PAYMENT_METHOD_MISMATCH`.
7. Segundo desacuerdo confirma con observacion para admin.

## Modulo Asesoria Fase 1

Para habilitar el rol `Asesor` y las columnas minimas de asesorias:

1. Crear backup de la base.
2. Revisar y aplicar `database/migrations/manual/007_modulo_asesoria_fase1.sql`.
3. Ejecutar `cd server && npx prisma generate`.
4. Opcional para datos demo: `node server/scripts/seed-advisory-phase1.js`.

El script demo usa `upsert`, no borra datos y crea:

- rol `Asesor` si falta;
- usuario `asesor@futurapp.com`;
- solicitante demo;
- asesoria programada;
- notificacion personal para el asesor.

## Solicitud De Asesoria Desde Usuario

Para habilitar la fase donde el usuario crea solicitudes:

1. Crear backup de la base.
2. Revisar y aplicar `database/migrations/manual/008_solicitud_asesoria_usuario.sql`.
3. Ejecutar `cd server && npx prisma generate`.
4. Probar con `node server/scripts/test-advisory-user-flow.js --start-server`.

Campos agregados a `asesorias`:

- `tipo_dispositivo`
- `telefono_principal`
- `telefono_alterno`
- `id_tipo_servicio`
- `descripcion_servicio_final`
- `fecha_actualizacion`

La ruta `POST /api/advisories` queda disponible solo para rol `usuario`.

## Resolucion De Asesoria Y Creacion De Servicio

Para habilitar la fase donde el asesor termina una asesoria y genera una solicitud de servicio:

1. Crear backup de la base.
2. Revisar y aplicar `database/migrations/manual/009_resolucion_asesoria_creacion_servicio.sql`.
3. Ejecutar:

```powershell
cd server
npx.cmd prisma validate
npx.cmd prisma generate
```

4. Probar con:

```powershell
node server/scripts/test-advisory-resolution-flow.js --start-server
```

Campo agregado a `asesorias`:

- `id_solicitud_servicio`

Relacion:

```text
asesorias.id_solicitud_servicio
  -> solicitudes_servicio.id_solicitud_servicio
```

Restricciones:

- `id_solicitud_servicio` es nullable mientras la asesoria esta pendiente.
- `id_solicitud_servicio` es unico para evitar duplicar servicios por asesoria.
- La FK usa `ON DELETE SET NULL` y `ON UPDATE CASCADE`.

Endpoints nuevos:

- `GET /api/advisories/catalogs`: solo asesor.
- `PATCH /api/advisories/:id/resolve`: solo asesor asignado.

Al resolver:

- la asesoria cambia a `Asesoria resuelta`;
- se crea una solicitud real en `solicitudes_servicio`;
- el servicio queda `Pendiente`, sin tecnico, sin cita y sin pago;
- se notifica al usuario, administradores activos y asesor.

## Gestion Administrativa De Asesorias

La fase administrativa no requiere cambios estructurales de base de datos adicionales. Reutiliza:

- `asesorias.id_usuario_asesor`
- `asesorias.estado`
- `usuarios`
- `roles`
- `notificaciones`

Endpoint agregado:

```text
PATCH /api/advisories/:id/assign
```

La ruta permite al rol `admin` asignar o reasignar un asesor activo cuando la asesoria no esta resuelta.

Frontend agregado:

```text
src/pages/AdminAsesoriasPage.jsx
```

Ruta de menu:

```text
asesorias-admin
```

Prueba:

```powershell
node server/scripts/test-advisory-admin-assignment-flow.js --start-server
```

Documentacion:

```text
docs/ADVISORY_ADMIN_ASSIGNMENT_PHASE.md
```

Backup generado antes de esta fase:

```text
database/backups/futurapp_before_advisory_resolution_20260616_100756.sql
```

Dump posterior generado:

```text
database/backups/futurapp_after_advisory_resolution_20260616_101412.sql
```

## Problemas Comunes

- Si `/api/health` muestra `database: disconnected`, iniciar MySQL desde XAMPP.
- Si `npx.cmd prisma generate` falla con `EPERM`, detener el backend Node que tiene cargado Prisma y volver a ejecutar.
- Si CORS falla, revisar `CLIENT_URL` en `server/.env`.
- Si root tiene contrasena, usar `-p` en comandos `mysql`/`mysqldump` y actualizar `DATABASE_URL`.

## Reversion

Para restaurar el estado previo a la normalizacion de roles:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\backups\futurapp_before_roles_normalization_20260609_221510.sql
```

No ejecutar `DROP DATABASE futurapp` salvo que se haga una restauracion completa y consciente.
