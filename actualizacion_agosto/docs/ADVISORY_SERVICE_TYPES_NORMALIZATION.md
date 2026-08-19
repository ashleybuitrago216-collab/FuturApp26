# Normalizacion De Tipos De Servicio En Asesorias

Fecha: 2026-06-22

## Objetivo

La asesoria es una etapa previa de orientacion y no debe tratarse como un servicio tecnico ejecutable por un tecnico.

Esta fase asegura que:

- El asesor solo seleccione tipos tecnicos reales al resolver una asesoria.
- El catalogo visible para asesor excluya nombres equivalentes a `Asesoria`.
- El backend rechace un `tipoServicioId` no tecnico aunque se envie manualmente por API.
- El servicio generado conserve `solicitudes_servicio.id_tipo_servicio`.
- El tecnico vea el tipo en modo lectura.
- El admin vea el tipo y el origen de asesoria sin cambiarlo en ese flujo.

## Diagnostico

Tabla real:

```text
tipos_servicio
id_tipo_servicio
nombre_servicio
descripcion_servicio
costo
```

No existen columnas:

- `activo`
- `categoria`
- `es_servicio_tecnico`

Tipos encontrados inicialmente:

- Mantenimiento Preventivo PC
- Instalacion de SO
- Revision de Red Domestica
- Reparacion de Pantalla Movil
- Asistencia Remota

No habia un tipo `Asesoria` en la base al iniciar el diagnostico, pero el backend no tenia una proteccion que lo impidiera si ese registro aparecia despues.

## Estrategia

Se eligio filtro por nombre, sin migracion estructural.

Motivos:

- La tabla no tiene campo clasificador.
- No se requiere modificar datos historicos.
- No se elimina ningun tipo existente.
- La regla queda en backend, no solo en frontend.

Nombres no tecnicos bloqueados, normalizados sin tildes ni espacios:

```text
asesoria
asesorias
orientacion
consulta
```

## Backend

Archivos modificados:

- `server/src/modules/advisories/advisories.service.js`
- `server/src/modules/services/services.service.js`
- `server/src/modules/services/services.mapper.js`

Cambios:

- `GET /api/advisories/catalogs`:
  - rol `asesor`: devuelve solo tipos tecnicos permitidos;
  - rol `admin`: conserva catalogo completo y lista de asesores activos.
- `PATCH /api/advisories/:id/resolve`:
  - valida que el tipo exista;
  - valida que sea tecnico;
  - rechaza `Asesoria` como tipo final;
  - crea la solicitud de servicio usando el ID real.
- `GET /api/services`:
  - expone `advisoryOriginId` / `asesoriaOrigenId` cuando el servicio viene de asesoria.
- `PATCH /api/services/:id`:
  - bloquea cambio de tipo si el servicio tiene `asesoriaOrigen`.

Mensaje de bloqueo:

```text
El tipo Asesoria no puede usarse como servicio tecnico.
```

## Frontend

Archivos modificados:

- `src/pages/AsesoriasPage.jsx`
- `src/pages/ServiciosPage.jsx`
- `src/components/ui/Button.jsx`
- `src/domains/services/services/serviceMappers.js`

Cambios:

- El selector del asesor consume el catalogo filtrado por backend.
- Si no hay tipos tecnicos, muestra:

```text
No hay tipos de servicio tecnicos disponibles.
```

- El tecnico ya no ve selector para cambiar tipo de servicio.
- El tecnico ve el tipo como texto.
- El admin ve:

```text
Origen: Asesoria #ID
```

cuando el servicio fue generado desde asesoria.

- Para servicios con origen asesoria, el modal admin muestra el tipo como solo lectura.

## Base De Datos

No se aplico SQL estructural.

No se ejecuto:

- `prisma migrate dev`
- `prisma db push`
- `DROP`
- `TRUNCATE`
- borrados destructivos

El script de pruebas puede crear de forma no destructiva un registro `Asesoria` si no existe, con el unico fin de validar que el backend lo filtra y rechaza.

## Pruebas

Script creado:

```bash
node server/scripts/test-advisory-service-types-normalization.js --start-server
```

Casos:

- ST01 catalogo del asesor no incluye `Asesoria`.
- ST02 catalogo admin conserva asesores y tipos necesarios.
- ST03 resolver con tipo tecnico valido crea servicio.
- ST04 resolver con `Asesoria` falla y no crea servicio.
- ST05 resolver sin tipo falla.
- ST06 tipo inexistente falla.
- ST07 tecnico visualiza tipo.
- ST08 tecnico no cambia tipo.
- ST09 admin ve tipo y origen.
- ST10 admin no cambia tipo en servicio generado desde asesoria.
- ST11 relacion asesoria-servicio se conserva.
- ST12 no regresion de flujo de asesorias.
- ST13 no regresion de asignacion tecnico/monto.
- ST14 no regresion general.

## Riesgos Y Pendientes

- Datos historicos podrian tener tipos no tecnicos si se cargan desde dumps antiguos.
- En una fase futura conviene agregar `es_servicio_tecnico` o `categoria`.
- Falta relacion formal entre tipos de servicio y areas/especialidades de tecnicos.
- El catalogo administrativo de tipos aun no tiene pantalla propia de mantenimiento.

## Proxima Fase Recomendada

Relacionar `tipos_servicio` con `areas_especialidad` para que el admin pueda filtrar tecnicos segun el tipo definido por el asesor.
