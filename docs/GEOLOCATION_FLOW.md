# Flujo de Geolocalizacion FuturApp

## Fase 3 - Seguimiento en tiempo real con Socket.IO

### Dependencias

- Backend: `socket.io`
- Frontend: `socket.io-client`

### Servidor

Express y Socket.IO comparten el mismo servidor HTTP en `server/src/server.js`.
La app Express se mantiene en `server/src/app.js`; Socket.IO se registra sobre el `http.createServer(app)` y queda disponible para los controllers mediante `app.set("io", io)`.

### Autenticacion

El cliente envia el JWT en `socket.handshake.auth.token`.
El backend valida el token con el mismo `JWT_SECRET` usado por HTTP y carga el usuario con `authService.findMe`.
No se envia ni se registra el token completo en eventos.

### Rooms

Cada servicio usa un room:

```text
service:{id}
```

Ejemplo:

```text
service:25
```

### Eventos

- `joinServiceLocation`: solicita unirse al room de un servicio.
- `leaveServiceLocation`: abandona el room del servicio.
- `technicianLocationUpdated`: se emite cuando el tecnico publica una nueva ubicacion.
- `locationSocketError`: comunica errores seguros al cliente.

### Roles permitidos para unirse

- Admin.
- Usuario dueno de la solicitud.
- Tecnico asignado a la solicitud.

No participan asesores en esta fase.

### Flujo tecnico

1. El tecnico abre el mapa o usa la accion de compartir ubicacion.
2. El frontend usa `navigator.geolocation`.
3. Se llama el endpoint existente `POST /api/locations/services/:id/technician-location`.
4. El backend valida permisos, guarda la ubicacion y conserva el historial.
5. El controller emite `technicianLocationUpdated` al room `service:{id}`.

### Flujo usuario/admin

1. Abren el modal del mapa.
2. El frontend carga estado inicial con `GET /api/locations/services/:id`.
3. El frontend carga historial con `GET /api/locations/services/:id/technician-history`.
4. El hook de Socket.IO se conecta, autentica y emite `joinServiceLocation`.
5. Cuando llega `technicianLocationUpdated`, se actualiza marcador, historial, distancia y ETA sin presionar Actualizar.

### Pruebas manuales

1. Abrir FuturApp en dos ventanas.
2. En una ventana iniciar sesion como usuario dueno y abrir el mapa del servicio.
3. En otra ventana iniciar sesion como tecnico asignado.
4. Compartir ubicacion actual desde el tecnico.
5. Confirmar que el mapa del usuario actualiza el marcador sin usar Actualizar.
6. Confirmar que el boton Actualizar sigue funcionando.
7. Cerrar el modal y verificar que no aparecen errores en consola.

### Limitaciones

- No se implementa OpenRouteService en esta fase.
- La ETA sigue siendo la estimacion simple del backend.
- El mapa usa actualizaciones por evento cuando el tecnico publica ubicacion; no hay streaming continuo automatico del GPS.

## Fase 4 - OpenRouteService, ruta y ETA real

### Variables de entorno

La API key vive solo en backend:

```text
ORS_API_KEY=
ORS_BASE_URL=https://api.openrouteservice.org
ORS_PROFILE=driving-car
GEO_ROUTE_CACHE_SECONDS=30
```

`ORS_API_KEY` no se expone al frontend y no debe escribirse en codigo fuente.

### Endpoint

```text
GET /api/locations/services/:id/route
```

Usa la ultima ubicacion del tecnico como origen y la ubicacion del servicio como destino.

### Proveedor

El backend llama a OpenRouteService Directions GeoJSON:

```text
POST /v2/directions/{profile}/geojson
```

El frontend solo llama al backend de FuturApp.

### Permisos

Pueden consultar ruta:

- Admin.
- Usuario dueno de la solicitud.
- Tecnico asignado.

Asesor no participa en esta fase.

### Fallback

Si falta `ORS_API_KEY`, OpenRouteService falla o la respuesta externa no es valida, el backend responde con distancia aproximada Haversine:

```json
{
  "fallback": true,
  "message": "No se pudo calcular la ruta real. Se muestra distancia aproximada."
}
```

El backend no tumba la API por fallos externos.

### Frontend

El mapa soporta:

- ruta real GeoJSON si existe;
- linea simple entre tecnico y servicio si no hay geometry;
- distancia real si existe;
- ETA real si existe;
- mensaje de fallback si se muestra distancia aproximada.

Para no saturar OpenRouteService, al recibir `technicianLocationUpdated` se refresca la ruta con un throttle minimo de 30 segundos. El boton Actualizar sigue disponible como respaldo manual.

### Limitaciones

- No se implementan notificaciones de tecnico cerca o llegada.
- No se guarda cache de ruta en base de datos.
- Si no hay ubicacion del servicio o del tecnico, el endpoint responde un mensaje controlado.

## Fase 5 - Notificaciones de tecnico cerca y llegada

### Variables de entorno

```text
GEO_NEAR_RADIUS_METERS=300
GEO_ARRIVAL_RADIUS_METERS=100
```

Si no estan configuradas, el backend usa 300 metros para cercania y 100 metros para llegada.

### Deteccion

Cuando el tecnico publica ubicacion con:

```text
POST /api/locations/services/:id/technician-location
```

el backend:

1. guarda la ubicacion;
2. calcula distancia Haversine contra la ubicacion del servicio;
3. compara con los umbrales configurados;
4. crea una notificacion interna al usuario dueno;
5. emite evento Socket.IO al room `service:{id}`.

### Notificaciones internas

Se reutiliza el modulo `notifications`.
Como el schema actual no tiene columnas de referencia/evento ni flags `tecnico_cerca_notificado` o `tecnico_llego_notificado`, la deduplicacion se hace con una clave interna estable embebida en el mensaje persistido:

```text
geo:{evento}:servicio:{idSolicitudServicio}
```

La busqueda compara usuario destino, tipo de notificacion, titulo y mensaje con esa clave interna. El mapper de notificaciones limpia la clave antes de devolver el mensaje al frontend, por lo que el usuario no la ve.

No se notifica al tecnico que comparte su propia ubicacion.

### Eventos Socket.IO

- `technicianNear`
- `technicianArrived`

Payload seguro:

```json
{
  "serviceId": 25,
  "type": "near",
  "message": "El tecnico esta cerca de tu ubicacion para el servicio #25.",
  "distanceMeters": 250,
  "thresholdMeters": 300
}
```

No se envian tokens, contrasenas ni datos completos de usuario.

### Frontend

El modal del mapa escucha los eventos y muestra una alerta simple sin cerrar el mapa ni recargar la pagina.
