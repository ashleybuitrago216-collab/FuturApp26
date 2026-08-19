# FuturApp - Flujo del modulo Reportes

## Objetivo

El modulo **Reportes** permite consultar informacion operativa segun el rol autenticado. El administrador ve una vista consolidada del sistema, mientras que tecnico y usuario ven paneles personales con datos asociados a su propia actividad.

## Alcance actual

La fase actual cubre los roles:

- `admin`;
- `tecnico`;
- `usuario`.

No se implementaron vistas para:

- asesor.

La ruta visual se muestra como **Reportes** y esta registrada para `admin`, `tecnico` y `usuario` en `src/app/router/appRoutes.jsx`.

## APIs utilizadas

La pantalla usa APIs existentes. No se crearon endpoints nuevos.

- `GET /api/users`
- `GET /api/services`
- `GET /api/appointments`
- `GET /api/payments`
- `GET /api/quotes`
- `GET /api/advisories`
- `GET /api/comments`

La vista de tecnico usa solo APIs relacionadas con su actividad autenticada:

- `GET /api/services`
- `GET /api/appointments`
- `GET /api/payments`
- `GET /api/quotes`
- `GET /api/comments`

No carga `GET /api/users` ni `GET /api/advisories`, para evitar mostrar informacion global o ajena al tecnico.

La vista de usuario usa solo APIs relacionadas con su cuenta autenticada:

- `GET /api/services`
- `GET /api/appointments`
- `GET /api/payments`
- `GET /api/quotes`
- `GET /api/advisories`
- `GET /api/comments`

No carga `GET /api/users`.

## KPIs calculados

Los indicadores se calculan en frontend a partir de las respuestas de las APIs:

- usuarios totales;
- usuarios activos;
- tecnicos registrados;
- asesores registrados;
- servicios totales;
- servicios pendientes;
- servicios completados;
- citas totales;
- citas confirmadas;
- pagos totales;
- pagos pagados;
- ingresos;
- cotizaciones totales;
- cotizaciones aprobadas;
- asesorias totales;
- asesorias resueltas;
- resenas totales;
- resenas respondidas;
- promedio de resenas.

## Periodo

El selector de periodo filtra los datasets por fechas disponibles en cada API.

Opciones:

- Todo;
- Hoy;
- Esta semana;
- Este mes;
- Este trimestre;
- Este ano.

Si una API no devuelve una fecha para cierto registro, ese registro no entra en filtros de periodo distintos de `Todo`.

## Exportacion

La pantalla permite descargar reportes en:

- PDF;
- Excel;
- CSV;

El formato JSON no se muestra como opcion principal para el usuario final.

Detalles de implementacion:

- PDF usa `jspdf` y se carga de forma dinamica solo al momento de descargar.
- Excel se genera como archivo `.xls` compatible con Excel usando una tabla HTML local.
- No se usa `xlsx`, porque la libreria reportaba vulnerabilidad alta sin arreglo disponible en auditoria npm.
- CSV conserva el flujo simple de texto separado por punto y coma.

Para administrador, los reportes disponibles son:

- General;
- Usuarios;
- Servicios;
- Citas;
- Pagos;
- Cotizaciones;
- Asesorias;
- Resenas.

La exportacion se realiza en frontend con los datos ya cargados. No hay almacenamiento de archivos en backend.

## Vista tecnico

La vista de tecnico es un panel personal con estilo mobile-first y tabs internas:

- Hoy;
- Reportes;
- Historial;
- Perfil.

Indicadores principales:

- actividades del dia;
- servicios pendientes;
- servicios completados;
- ganancias estimadas;
- servicios por periodo;
- pagos relacionados;
- cotizaciones;
- resenas;
- calificacion promedio.

El tecnico puede descargar su reporte personal en PDF, Excel o CSV. Los datos provienen de las APIs existentes y respetan los filtros/permisos actuales del backend.

La exportacion tecnica contiene indicadores agregados del tecnico autenticado, no listados globales ni datos de otros tecnicos.

## Vista usuario

La vista de usuario es personal y no incluye una tab o seccion llamada "Servicios".

Tabs internas:

- Resumen;
- Pagos;
- Facturas;
- Actividad.

Indicadores principales:

- solicitudes registradas;
- solicitudes completadas;
- pagos realizados;
- pagos pendientes;
- total pagado;
- citas;
- cotizaciones;
- resenas.

El usuario puede descargar un reporte personal en PDF, Excel o CSV desde la tab Facturas. La exportacion contiene indicadores agregados de su cuenta y no incluye datos globales, datos de otros usuarios ni datos sensibles.

## Seguridad y permisos

La navegacion muestra Reportes solo a `admin`, `tecnico` y `usuario`.

La pantalla tambien valida el rol en frontend y muestra un mensaje controlado si otro rol intenta renderizarla por accidente.

Las APIs usadas siguen protegidas por JWT y por sus reglas actuales de backend.

Filtrado backend confirmado para tecnico:

- servicios: solicitudes con cita asignada al tecnico autenticado;
- citas: citas con `idUsuarioTecnico` del tecnico autenticado;
- pagos: pagos de citas asignadas al tecnico autenticado;
- cotizaciones: cotizaciones con `idUsuarioTecnico` del tecnico autenticado;
- resenas: resenas de servicios donde el tecnico esta asignado.

Para usuario, las APIs existentes devuelven datos asociados a su cuenta autenticada segun las reglas actuales de cada modulo. La vista no carga `GET /api/users`, no muestra estadisticas administrativas y no incluye una tab o seccion llamada "Servicios"; la actividad se presenta como solicitudes, pagos, facturas y actividad general.

Para reducir exposicion en descargas, las exportaciones no incluyen contrasenas, telefonos ni hashes. La exportacion de usuario usa solo indicadores agregados personales.

## Limitaciones

- Los KPIs se calculan en frontend usando APIs existentes.
- No hay endpoints backend especificos de reportes.
- No se implemento vista para asesor.
- La exportacion actual se genera en frontend en PDF, Excel o CSV.
- Algunas metricas dependen de los campos disponibles en cada API.
- El filtro de periodo depende de que los registros incluyan fechas.
- Las ganancias del tecnico usan los campos disponibles de pagos; si la API no entrega ganancia tecnica separada, se usa el monto asociado como aproximacion operativa.
- El warning de bundle grande de Vite no bloquea el build.

## Mejoras futuras

- Crear endpoints backend especificos para reportes agregados.
- Agregar plantillas visuales avanzadas para PDF.
- Agregar reportes por rangos de fecha personalizados.
- Agregar reportes financieros mas detallados por tecnico y metodo de pago.
- Agregar pruebas automatizadas para exportacion y permisos de la vista.
